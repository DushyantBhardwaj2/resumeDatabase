import { Worker } from 'bullmq'
import { logger } from '@/infrastructure/logger'
import { bullmqConnectionOpts, redisClient } from './redis'
import type { PdfJobData } from './pdf-queue'
import { LatexCompiler } from '../latex/latex-compiler'

/** How long (seconds) the compiled PDF blob is kept in Redis after completion */
const PDF_RESULT_TTL_SECONDS = parseInt(process.env.PDF_RESULT_TTL || '300')

const latexCompiler = new LatexCompiler()

let pdfWorker: Worker<PdfJobData> | null = null

export function startPdfWorker(): Worker<PdfJobData> {
  if (pdfWorker) return pdfWorker

  pdfWorker = new Worker<PdfJobData>(
    'pdf-compile',
    async (job) => {
      const { latexSource, templateId } = job.data

      try {
        const pdfBytes = await latexCompiler.compile(latexSource, templateId, job.id || 'unknown')

        await redisClient.setex(
          `pdf:result:${job.id}`,
          PDF_RESULT_TTL_SECONDS,
          pdfBytes.toString('base64'),
        )

        logger.info({ jobId: job.id, bytes: pdfBytes.length, ttlSeconds: PDF_RESULT_TTL_SECONDS, tag: 'PDF Worker' }, 'job completed with bytes')
        return { bytes: pdfBytes.length }
      } catch (err: any) {
        logger.error({ jobId: job.id, err: err.message, tag: 'PDF Worker' }, 'job failed')
        throw err
      }
    },
    {
      connection: bullmqConnectionOpts,
      concurrency: 2,
    },
  )

  pdfWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, tag: 'PDF Worker' }, 'completed job')
  })

  pdfWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message, tag: 'PDF Worker' }, 'failed job')
  })

  pdfWorker.on('error', (err) => {
    logger.error({ err: err.message, tag: 'PDF Worker' }, 'worker error')
  })

  logger.info({ tag: 'PDF Worker' }, 'started (concurrency=2)')
  return pdfWorker
}

export async function stopPdfWorker(): Promise<void> {
  if (!pdfWorker) return
  logger.info({ tag: 'PDF Worker' }, 'shutting down')
  await pdfWorker.close()
  pdfWorker = null
}
