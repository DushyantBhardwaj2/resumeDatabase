import { Router, Request, Response } from "express"
import { requireSession } from "../middleware/auth"
import { container } from "../di/container"
import { z } from "zod"

const router = Router()

const requestSchema = z.object({
  section: z.enum(["experience", "projects", "skills", "summary", "project", "experience_entry"]),
  rawInput: z.string().min(1),
  context: z.record(z.string(), z.any()).optional(),
})

router.post("/generate-bullets", requireSession, async (req: Request, res: Response) => {
  try {
    const validation = requestSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(422).json({ error: "Invalid request", details: validation.error.flatten() })
      return
    }

    const { section, rawInput, context } = validation.data
    const result = await container.aiUseCases.generate(section, rawInput, context)
    res.json(result)
  } catch (e) {
    console.error("AI generate-bullets error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

export default router
