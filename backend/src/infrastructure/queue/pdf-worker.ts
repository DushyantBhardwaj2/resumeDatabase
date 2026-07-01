import { Worker } from 'bullmq'
import { bullmqConnectionOpts, redisClient } from './redis'
import type { PdfJobData } from './pdf-queue'
import { LatexCompiler } from '../latex/latex-compiler'

/** How long (seconds) the compiled PDF blob is kept in Redis after completion */
const PDF_RESULT_TTL_SECONDS = 300 // 5 minutes

const latexCompiler = new LatexCompiler()

// ── Worker ────────────────────────────────────────────────────────────────────
// Runs in-process alongside the Hono HTTP server.
// concurrency=2 means up to 2 pdflatex processes can run in parallel.
// execFileAsync is genuinely async — neither compile blocks the event loop.
export const pdfWorker = new Worker<PdfJobData>(
  'pdf-compile',
  async (job) => {
    const { latexSource, templateId } = job.data

    try {
      const pdfBytes = await latexCompiler.compile(latexSource, templateId, job.id || 'unknown')

      // ── Store result in Redis with TTL ────────────────────────────────────
      // ioredis SETEX requires a string value; encode the binary as base64.
      await redisClient.setex(
        `pdf:result:${job.id}`,
        PDF_RESULT_TTL_SECONDS,
        pdfBytes.toString('base64'),
      )

      console.log(`[PDF Worker] job ${job.id} → ${pdfBytes.length} bytes, TTL=${PDF_RESULT_TTL_SECONDS}s`)
      return { bytes: pdfBytes.length }
    } catch (err: any) {
      console.error(`[PDF Worker] job ${job.id} failed:`, err.message)
      throw err
    }
  },
  {
    connection: bullmqConnectionOpts,
    concurrency: 2,
  },
)

pdfWorker.on('completed', (job) => {
  console.log(`[PDF Worker] completed job ${job.id}`)
})

pdfWorker.on('failed', (job, err) => {
  console.error(`[PDF Worker] failed job ${job?.id}:`, err.message)
})

pdfWorker.on('error', (err) => {
  console.error('[PDF Worker] worker error:', err.message)
})
