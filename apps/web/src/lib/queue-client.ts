/**
 * BullMQ queue client for the web app.
 * Used to immediately dispatch monitor check jobs when monitors are created,
 * rather than waiting for the checker worker's 5-minute reconcile cycle.
 */
import { Queue } from 'bullmq'

export type { Queue }

function getRedisConnection() {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null as null,
  }
}

let _checkQueue: Queue | null = null

export function getCheckQueue(): Queue {
  if (!_checkQueue) {
    _checkQueue = new Queue('monitor-checks', { connection: getRedisConnection() })
  }
  return _checkQueue
}

export interface MonitorJobConfig {
  id: string
  url: string
  type: 'http' | 'tcp' | 'keyword'
  intervalSeconds: number
  timeoutMs: number
  keywordValue?: string
}

/**
 * Schedule a repeatable BullMQ job for a monitor.
 * Safe to call multiple times — BullMQ deduplicates by jobId.
 */
export async function scheduleMonitorJob(monitor: MonitorJobConfig): Promise<void> {
  const queue = getCheckQueue()
  const region = process.env.CHECKER_REGION ?? 'eu'

  await queue.add(
    monitor.id,
    {
      monitorId: monitor.id,
      url: monitor.url,
      type: monitor.type,
      timeoutMs: monitor.timeoutMs,
      keywordValue: monitor.keywordValue,
      region,
    },
    {
      repeat: { every: monitor.intervalSeconds * 1000 },
      jobId: `monitor-${monitor.id}`,
    }
  )
}

/**
 * Remove the BullMQ repeatable job for a monitor.
 */
export async function removeMonitorJob(monitorId: string): Promise<void> {
  const queue = getCheckQueue()
  const repeatableJobs = await queue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    if (job.name === monitorId) {
      await queue.removeRepeatableByKey(job.key)
    }
  }
}
