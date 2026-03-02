import { Queue, Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

export const checkQueue = new Queue('monitor-checks', { connection })

export type CheckJobData = {
  monitorId: string
  url: string
  type: 'http' | 'tcp' | 'keyword'
  timeoutMs: number
  keywordValue?: string
  region: string
}

export { connection }
