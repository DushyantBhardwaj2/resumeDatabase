import { execFile } from 'child_process'
import { promisify } from 'util'
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  copyFileSync,
  rmSync,
} from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const execFileAsync = promisify(execFile)

export class LatexCompiler {
  /**
   * Compiles LaTeX source code into a PDF buffer.
   * @param latexSource The full LaTeX source string
   * @param templateId The ID of the template (used to locate assets like logos)
   * @param jobId A unique ID for the job (used for temp file naming)
   * @returns A Buffer containing the compiled PDF
   */
  async compile(latexSource: string, templateId: string, jobId: string): Promise<Buffer> {
    const tempDir = mkdtempSync(join(tmpdir(), 'latex-'))
    const texPath = join(tempDir, `${jobId}.tex`)
    const pdfPath = join(tempDir, `${jobId}.pdf`)

    try {
      // ── Copy template logo asset ──────────────────────────────────────────
      // At runtime __dirname = dist/infrastructure/latex/
      // Templates live at   dist/infrastructure/latex/templates/
      const templatesDir = join(__dirname, 'templates')
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

      return readFileSync(pdfPath)
    } finally {
      // ── Guaranteed cleanup ────────────────────────────────────────────────
      // Runs even when an error is thrown — prevents temp file accumulation
      // even if the PDF is missing.
      try {
        rmSync(tempDir, { recursive: true, force: true })
      } catch { /* best-effort; OS will eventually reclaim /tmp */ }
    }
  }
}
