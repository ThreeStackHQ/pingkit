import { Queue } from 'bullmq'
import { z } from 'zod'

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

// SEC-004: Zod schema for BullMQ job data — validated at worker ingestion time
export const checkJobDataSchema = z.object({
  monitorId: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['http', 'tcp', 'keyword']),
  timeoutMs: z.number().int().min(1000).max(60000),
  keywordValue: z.string().optional(),
  region: z.string().min(1),
})

export type CheckJobData = z.infer<typeof checkJobDataSchema>

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
