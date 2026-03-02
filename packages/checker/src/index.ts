import * as net from 'net'
import { Worker, type Job } from 'bullmq'
import { db, monitors, checks, incidents } from '@pingkit/db'
import { eq, and, isNull, desc, ne } from 'drizzle-orm'
import { connection, checkQueue, addMonitorJob, removeMonitorJob, type CheckJobData } from './queue.js'
import { triggerAlerts, triggerRecovery } from './alerts.js'

const REGION = process.env.CHECKER_REGION ?? 'eu'
const CONSECUTIVE_FAILURES_BEFORE_DOWN = 2

// Track consecutive failure counts in memory (resets on restart — acceptable)
const consecutiveFailures = new Map<string, number>()

async function doHttpCheck(url: string, timeoutMs: number, expectedCode = 200): Promise<{
  status: 'up' | 'down'
  responseMs: number
  statusCode: number
  error?: string
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' })
    clearTimeout(timer)
    const responseMs = Date.now() - start
    const ok = res.status === expectedCode
    return { status: ok ? 'up' : 'down', responseMs, statusCode: res.status }
  } catch (err: any) {
    clearTimeout(timer)
    return {
      status: 'down',
      responseMs: Date.now() - start,
      statusCode: 0,
      error: err.name === 'AbortError' ? 'Request timed out' : err.message,
    }
  }
}

async function doTcpCheck(url: string, timeoutMs: number): Promise<{
  status: 'up' | 'down'
  responseMs: number
  error?: string
}> {
  const parsed = new URL(url)
  const host = parsed.hostname
  const port = parseInt(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80)

  return new Promise(resolve => {
    const start = Date.now()
    const socket = new net.Socket()

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => {
      socket.destroy()
      resolve({ status: 'up', responseMs: Date.now() - start })
    })
    socket.once('error', (err) => {
      resolve({ status: 'down', responseMs: Date.now() - start, error: err.message })
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve({ status: 'down', responseMs: Date.now() - start, error: 'TCP timeout' })
    })
    socket.connect({ host, port })
  })
}

async function doKeywordCheck(url: string, timeoutMs: number, keyword: string): Promise<{
  status: 'up' | 'down'
  responseMs: number
  statusCode: number
  error?: string
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const body = await res.text()
    const responseMs = Date.now() - start
    const found = body.includes(keyword)
    return {
      status: found ? 'up' : 'down',
      responseMs,
      statusCode: res.status,
      error: found ? undefined : `Keyword "${keyword}" not found in response`,
    }
  } catch (err: any) {
    clearTimeout(timer)
    return {
      status: 'down',
      responseMs: Date.now() - start,
      statusCode: 0,
      error: err.name === 'AbortError' ? 'Request timed out' : err.message,
    }
  }
}

async function processMonitorCheck(jobData: CheckJobData) {
  const { monitorId, url, type, timeoutMs, keywordValue, region } = jobData

  // Run the appropriate check
  let checkResult: { status: 'up' | 'down'; responseMs: number; statusCode?: number; error?: string }

  if (type === 'tcp') {
    const result = await doTcpCheck(url, timeoutMs)
    checkResult = { ...result, statusCode: 0 }
  } else if (type === 'keyword') {
    checkResult = await doKeywordCheck(url, timeoutMs, keywordValue ?? '')
  } else {
    checkResult = await doHttpCheck(url, timeoutMs)
  }

  // Persist check result
  await db.insert(checks).values({
    monitorId,
    status: checkResult.status as 'up' | 'down' | 'timeout' | 'error',
    responseMs: checkResult.responseMs,
    statusCode: checkResult.statusCode ?? 0,
    region: region ?? REGION,
    error: checkResult.error,
  })

  // Get current monitor state
  const monitor = await db.query.monitors.findFirst({
    where: eq(monitors.id, monitorId),
    columns: { id: true, status: true, workspaceId: true, avgResponseMs: true },
  })
  if (!monitor) return

  const rawStatus = checkResult.status

  // False-positive protection: require N consecutive failures before marking down
  if (rawStatus === 'down') {
    const failures = (consecutiveFailures.get(monitorId) ?? 0) + 1
    consecutiveFailures.set(monitorId, failures)
    if (failures < CONSECUTIVE_FAILURES_BEFORE_DOWN) {
      // Not yet confirmed down — don't change monitor status
      return
    }
  } else {
    consecutiveFailures.set(monitorId, 0)
  }

  const newStatus = rawStatus
  const previousStatus = monitor.status

  // Update monitor status + avg response
  const newAvg = monitor.avgResponseMs
    ? Math.round((monitor.avgResponseMs * 0.9) + (checkResult.responseMs * 0.1))
    : checkResult.responseMs

  await db.update(monitors)
    .set({
      status: newStatus as 'up' | 'down' | 'paused' | 'pending',
      avgResponseMs: newAvg,
      lastCheckedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(monitors.id, monitorId))

  // Handle status transitions
  if (previousStatus !== 'down' && newStatus === 'down') {
    // Create new incident
    const [incident] = await db.insert(incidents).values({
      monitorId,
      cause: checkResult.error ?? 'check failed',
    }).returning()

    await triggerAlerts(monitorId, incident.id)
  } else if (previousStatus === 'down' && newStatus === 'up') {
    // Resolve open incident
    const openIncident = await db.query.incidents.findFirst({
      where: and(eq(incidents.monitorId, monitorId), isNull(incidents.resolvedAt)),
      orderBy: [desc(incidents.startedAt)],
    })

    if (openIncident) {
      const durationMs = Date.now() - openIncident.startedAt.getTime()
      await db.update(incidents)
        .set({ resolvedAt: new Date(), durationMs })
        .where(eq(incidents.id, openIncident.id))

      await triggerRecovery(monitorId, openIncident.id)
    }
  }
}

// Main worker
const worker = new Worker<CheckJobData>(
  'monitor-checks',
  async (job: Job<CheckJobData>) => {
    await processMonitorCheck(job.data)
  },
  { connection, concurrency: 20 }
)

worker.on('completed', (job) => {
  console.log(`✅ Check completed for monitor ${job.data.monitorId}`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Check failed for monitor ${job?.data?.monitorId}: ${err.message}`)
})

// Reconcile: schedule BullMQ repeatable jobs for all active monitors
async function reconcileJobs() {
  console.log('🔄 Reconciling monitor jobs...')
  const activeMonitors = await db.query.monitors.findMany({
    where: ne(monitors.status, 'paused' as const),
    columns: {
      id: true,
      url: true,
      type: true,
      intervalSeconds: true,
      timeoutMs: true,
      keywordValue: true,
    },
  })

  // Get currently scheduled repeatable jobs
  const existingJobs = await checkQueue.getRepeatableJobs()
  const existingKeys = new Set(existingJobs.map(j => j.key))

  for (const monitor of activeMonitors) {
    await addMonitorJob({
      id: monitor.id,
      url: monitor.url,
      type: monitor.type as 'http' | 'tcp' | 'keyword',
      intervalSeconds: monitor.intervalSeconds,
      timeoutMs: monitor.timeoutMs,
      keywordValue: monitor.keywordValue ?? undefined,
    })
  }

  // Remove jobs for deleted/paused monitors
  const activeIds = new Set(activeMonitors.map(m => m.id))
  for (const job of existingJobs) {
    const jobMonitorId = job.name
    if (!activeIds.has(jobMonitorId)) {
      await removeMonitorJob(jobMonitorId)
      console.log(`🗑️ Removed job for monitor ${jobMonitorId}`)
    }
  }

  console.log(`✅ Reconciled ${activeMonitors.length} monitors`)
}

// Reconcile on startup and every 5 minutes
reconcileJobs().catch(console.error)
setInterval(() => reconcileJobs().catch(console.error), 5 * 60 * 1000)

process.on('SIGTERM', async () => {
  console.log('Shutting down checker worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Shutting down checker worker...')
  await worker.close()
  process.exit(0)
})

console.log('🚀 PingKit checker worker started')
