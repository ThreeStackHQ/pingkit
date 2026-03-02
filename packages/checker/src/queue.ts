import { Queue } from 'bullmq'

// Use connection options instead of IORedis instance to avoid version conflicts
function getRedisConnection() {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null as null,
  }
}

export const connection = getRedisConnection()

export const checkQueue = new Queue('monitor-checks', { connection })

export type CheckJobData = {
  monitorId: string
  url: string
  type: 'http' | 'tcp' | 'keyword'
  timeoutMs: number
  keywordValue?: string
  region: string
}

export interface MonitorConfig {
  id: string
  url: string
  type: 'http' | 'tcp' | 'keyword'
  intervalSeconds: number
  timeoutMs: number
  keywordValue?: string
  region?: string
}

export async function addMonitorJob(monitor: MonitorConfig) {
  const jobData: CheckJobData = {
    monitorId: monitor.id,
    url: monitor.url,
    type: monitor.type,
    timeoutMs: monitor.timeoutMs,
    keywordValue: monitor.keywordValue,
    region: monitor.region ?? process.env.CHECKER_REGION ?? 'eu',
  }

  await checkQueue.add(
    monitor.id,
    jobData,
    {
      repeat: { every: monitor.intervalSeconds * 1000 },
      jobId: `monitor-${monitor.id}`,
    }
  )
}

export async function removeMonitorJob(monitorId: string) {
  const repeatableJobs = await checkQueue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    if (job.name === monitorId) {
      await checkQueue.removeRepeatableByKey(job.key)
    }
  }
}
