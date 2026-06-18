import { Router, Request, Response } from "express"
import { requireSession } from "../middleware/auth"
import { container } from "../../../src/di/container"

const router = Router()

router.get("/", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const profile = await container.profileUseCases.getProfile(session.user.id)
    if (!profile) {
      res.status(404).json({ error: "Profile not found" })
      return
    }
    res.json(profile)
  } catch (e) {
    console.error("Profile GET error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

router.put("/", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const profile = await container.profileUseCases.updateProfile(session.user.id, req.body)
    res.json(profile)
  } catch (e) {
    console.error("Profile PUT error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

export default router
