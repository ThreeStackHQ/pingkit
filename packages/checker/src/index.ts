import { Worker } from 'bullmq'
import { connection } from './queue.js'

const worker = new Worker(
  'monitor-checks',
  async (job) => {
    console.log(`Processing check job ${job.id} for monitor ${job.data.monitorId}`)
    // TODO: Implement check logic in [2.2] Checker BullMQ Worker task
  },
  { connection }
)

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`)
})

process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await worker.close()
  process.exit(0)
})

console.log('PingKit checker worker started')
