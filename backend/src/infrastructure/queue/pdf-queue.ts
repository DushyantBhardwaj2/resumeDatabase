import { Queue } from 'bullmq'
import { bullmqConnectionOpts } from './redis'

// ── Job payload type ──────────────────────────────────────────────────────────
export type PdfJobData = {
  /** Fully-filled LaTeX source string (output of LatexTemplateFiller.fill()) */
  latexSource: string
  /** Template ID needed to locate logo assets for copying into temp dir */
  templateId: string
}

// ── Queue ─────────────────────────────────────────────────────────────────────
// BullMQ creates its own internal ioredis connection from bullmqConnectionOpts.
// This avoids the TypeScript version-mismatch error that occurs when we pass
// our IORedis instance to BullMQ (which bundles a different ioredis internally).
export const pdfQueue = new Queue<PdfJobData>('pdf-compile', {
  connection: bullmqConnectionOpts,
  defaultJobOptions: {
    // LaTeX errors are deterministic — retrying the same source won't help
    attempts: 1,
    // Keep a small sliding window of completed / failed jobs for debugging
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
})

// ── Helper ────────────────────────────────────────────────────────────────────
/**
 * Enqueue a PDF compilation job and return its BullMQ job ID.
 * The caller uses this ID to poll /compile-status/:jobId and
 * fetch the result from /compile-result/:jobId.
 */
export async function addPdfJob(data: PdfJobData): Promise<string> {
  const job = await pdfQueue.add('compile', data)
  if (!job.id) throw new Error('Job enqueued but BullMQ returned no ID')
  return job.id
}
