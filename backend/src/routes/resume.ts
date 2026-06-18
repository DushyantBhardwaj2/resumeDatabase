import { Router, Request, Response } from "express"
import multer from "multer"
import { requireSession } from "../middleware/auth"
import { container } from "../di/container"
import { z } from "zod"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are accepted"))
      return
    }
    cb(null, true)
  },
})

const router = Router()

const tailorRequestSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  jobDescription: z.string().min(50),
})

router.post("/parse", requireSession, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" })
      return
    }
    const buffer = req.file.buffer
    const { rawText, parsed } = await container.resumeUseCases.parseResume(buffer)
    res.json({ rawText, parsed })
  } catch (e) {
    console.error("Resume parse error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

router.post("/tailor", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const validation = tailorRequestSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(422).json({ error: "Invalid request", details: validation.error.flatten() })
      return
    }
    const result = await container.resumeUseCases.tailorResume(session.user.id, validation.data)
    res.json(result)
  } catch (e) {
    console.error("Tailor error:", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    let status = 500
    if (message.includes("Profile not found")) status = 404
    if (message.includes("Invalid request") || message.includes("Complete onboarding")) status = 400
    if (message.includes("Unauthorized")) status = 401
    if (message.includes("Missing OPENCODE_API_KEY")) status = 503
    res.status(status).json({ error: message })
  }
})

export default router
