import { Router, Request, Response } from "express"
import { execFile } from "child_process"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { promisify } from "util"

const execAsync = promisify(execFile)
const router = Router()

router.post("/", async (req: Request, res: Response) => {
  const { latex } = req.body

  if (!latex || typeof latex !== "string") {
    res.status(400).json({ error: "Missing 'latex' field in request body" })
    return
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
    try {
      await execAsync("pdflatex", [
        "-interaction=nonstopmode",
        "-output-directory", tmpDir,
        texPath,
      ], { timeout: 30000 })
    } catch {
      // Ignore — PDF may still exist
    }
  }

  try {
    const pdf = readFileSync(pdfPath)
    rmSync(tmpDir, { recursive: true, force: true })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf")
    res.send(pdf)
  } catch (err) {
    rmSync(tmpDir, { recursive: true, force: true })
    console.error("Failed to read PDF:", err)
    res.status(500).json({ error: "Failed to compile LaTeX to PDF" })
  }
})

export default router
