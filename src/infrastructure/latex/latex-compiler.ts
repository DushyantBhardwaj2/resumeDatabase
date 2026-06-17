import { execFile } from "child_process"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { promisify } from "util"
import type { ILatexCompiler } from "../../core/application/ports/latex-compiler"

const execAsync = promisify(execFile)

export class LatexCompiler implements ILatexCompiler {
  async compile(latex: string): Promise<Buffer> {
    // If a service URL is configured (e.g., in Vercel production), use the Render microservice
    const serviceUrl = process.env.LATEX_SERVICE_URL;
    if (serviceUrl) {
      console.log(`Sending compilation request to ${serviceUrl}`);
      const response = await fetch(`${serviceUrl}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex }),
      });

      if (!response.ok) {
        throw new Error(`External LaTeX compilation failed with status ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Fallback to local pdflatex for local development
    console.log("Compiling LaTeX locally...");
    const tmpDir = mkdtempSync(join(tmpdir(), "resumint-"))
    const texPath = join(tmpDir, "resume.tex")
    const pdfPath = join(tmpDir, "resume.pdf")

    writeFileSync(texPath, latex, "utf-8")

    try {
      await execAsync("pdflatex", [
        "-interaction=nonstopmode",
        "-output-directory", tmpDir,
        texPath,
      ], { timeout: 30000 })
    } catch {
      await execAsync("pdflatex", [
        "-interaction=nonstopmode",
        "-output-directory", tmpDir,
        texPath,
      ], { timeout: 30000 }).catch(() => {})
    }

    const pdf = readFileSync(pdfPath)
    rmSync(tmpDir, { recursive: true, force: true })

    return pdf
  }
}
