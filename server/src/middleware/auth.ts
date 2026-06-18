import { Request, Response, NextFunction } from "express"
import { auth } from "../../src/config/auth"

export async function requireSession(req: Request, res: Response, next: NextFunction) {
  try {
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v)
        } else {
          headers.set(key, value)
        }
      }
    }
    const session = await auth.api.getSession({ headers })
    if (!session) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }
    ;(req as any).session = session
    next()
  } catch (e) {
    console.error("Auth middleware error:", e)
    res.status(500).json({ error: "Authentication error" })
  }
}
