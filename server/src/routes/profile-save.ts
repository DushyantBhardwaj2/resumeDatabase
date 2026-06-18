import { Router, Request, Response } from "express"
import { requireSession } from "../middleware/auth"
import { container } from "../../../src/di/container"
import { parsedResumeSchema } from "../../../src/infrastructure/validation"
import type { Profile } from "../../../src/core/domain/entities"

const router = Router()

router.post("/", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const body = req.body
    const validation = parsedResumeSchema.safeParse(body.parsed)
    if (!validation.success) {
      res.status(422).json({ error: "Invalid profile data", details: validation.error.flatten() })
      return
    }

    const profile = await container.profileUseCases.saveFromOnboarding(
      session.user.id,
      body.rawText || "",
      validation.data as unknown as Profile
    )
    res.json({ profile })
  } catch (e) {
    console.error("Profile save error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

export default router
