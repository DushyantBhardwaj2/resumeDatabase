import { NextRequest } from "next/server"
import { execFile } from "child_process"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { promisify } from "util"

const execAsync = promisify(execFile)

export async function POST(request: NextRequest) {
  try {
    const { latex } = await request.json()
    if (!latex || typeof latex !== "string") {
      return Response.json({ error: "Missing 'latex' field" }, { status: 422 })
    }

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

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=resume.pdf",
      },
    })
  } catch (e) {
    console.error("Compile error:", e)
    return Response.json({ error: "Failed to compile LaTeX" }, { status: 500 })
  }
}
