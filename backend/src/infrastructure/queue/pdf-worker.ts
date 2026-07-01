import { Worker } from 'bullmq'
import { execFile } from 'child_process'
import { promisify } from 'util'
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  copyFileSync,
  readdirSync,
  unlinkSync,
  rmSync,
} from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { bullmqConnectionOpts, redisClient } from './redis'
import type { PdfJobData } from './pdf-queue'

const execFileAsync = promisify(execFile)

/** How long (seconds) the compiled PDF blob is kept in Redis after completion */
const PDF_RESULT_TTL_SECONDS = 300 // 5 minutes

// ── Worker ────────────────────────────────────────────────────────────────────
// Runs in-process alongside the Hono HTTP server.
// concurrency=2 means up to 2 pdflatex processes can run in parallel.
// execFileAsync is genuinely async — neither compile blocks the event loop.
export const pdfWorker = new Worker<PdfJobData>(
  'pdf-compile',
  async (job) => {
    const { latexSource, templateId } = job.data

    // Create an isolated temp directory for this job
    const tempDir = mkdtempSync(join(tmpdir(), 'latex-'))
    const texPath = join(tempDir, `${job.id}.tex`)
    const pdfPath = join(tempDir, `${job.id}.pdf`)

    try {
      // ── Copy template logo asset ──────────────────────────────────────────
      // At runtime __dirname = dist/infrastructure/queue/
      // Templates live at   dist/infrastructure/latex/templates/
      const templatesDir = join(__dirname, '..', 'latex', 'templates')
      const logoPath = join(templatesDir, templateId, 'NSUT_logo.png')
      if (existsSync(logoPath)) {
        copyFileSync(logoPath, join(tempDir, 'NSUT_logo.png'))
      }

      // ── Run pdflatex (truly async — event loop stays free) ────────────────
      writeFileSync(texPath, latexSource, 'utf-8')
      try {
        await execFileAsync(
          'pdflatex',
          ['-interaction=nonstopmode', `-output-directory=${tempDir}`, texPath],
          { timeout: 30_000 },
        )
      } catch {
        // pdflatex exits non-zero even when the PDF is produced (LaTeX warnings
        // are treated as errors by the process exit code). We verify by file existence.
      }

      // ── Verify output ─────────────────────────────────────────────────────
      if (!existsSync(pdfPath)) {
        const logPath = texPath.replace(/\.tex$/, '.log')
        let logTail = ''
        try { logTail = readFileSync(logPath, 'utf-8').slice(-1500) } catch { /* no log */ }
        throw new Error(`pdflatex did not produce an output PDF.\n${logTail}`.trim())
      }

      const pdfBytes = readFileSync(pdfPath)

      // ── Store result in Redis with TTL ────────────────────────────────────
      // ioredis SETEX requires a string value; encode the binary as base64.
      await redisClient.setex(
        `pdf:result:${job.id}`,
        PDF_RESULT_TTL_SECONDS,
        pdfBytes.toString('base64'),
      )

      console.log(`[PDF Worker] job ${job.id} → ${pdfBytes.length} bytes, TTL=${PDF_RESULT_TTL_SECONDS}s`)
      return { bytes: pdfBytes.length }
    } finally {
      // ── Guaranteed cleanup ────────────────────────────────────────────────
      // Runs even when an error is thrown — prevents temp file accumulation
      // even if the PDF is missing or Redis write fails.
      try {
        rmSync(tempDir, { recursive: true, force: true })
      } catch { /* best-effort; OS will eventually reclaim /tmp */ }
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
