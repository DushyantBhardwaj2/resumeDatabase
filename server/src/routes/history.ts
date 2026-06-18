import { Router, Request, Response } from "express"
import { requireSession } from "../middleware/auth"
import { container } from "../../../src/di/container"

const router = Router()

router.get("/", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const search = req.query.search as string | undefined
    const items = await container.historyUseCases.list(session.user.id, search)
    res.json({ items })
  } catch (e) {
    console.error("History GET error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

router.get("/:id", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const { id } = req.params
    const resume = await container.historyUseCases.get(id, session.user.id)
    if (!resume) {
      res.status(404).json({ error: "Not found" })
      return
    }
    res.json(resume)
  } catch (e) {
    console.error("History GET error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

router.delete("/:id", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const { id } = req.params
    await container.historyUseCases.delete(id, session.user.id)
    res.json({ success: true })
  } catch (e) {
    console.error("History DELETE error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

router.put("/:id/styling", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const { id } = req.params
    await container.historyUseCases.updateStyling(id, session.user.id, req.body)
    res.json({ success: true })
  } catch (e) {
    console.error("Styling PUT error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

export default router
