import { Router, Request, Response } from "express"
import { requireSession } from "../middleware/auth"
import { container } from "../../../src/di/container"
import { z } from "zod"

const router = Router()

const importSchema = z.object({
  repos: z.array(z.object({ name: z.string(), url: z.string(), language: z.string().nullable() })),
})

router.get("/repos", requireSession, async (req: Request, res: Response) => {
  try {
    const username = req.query.username as string
    if (!username) {
      res.status(400).json({ error: "username query parameter is required" })
      return
    }

    const ghRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "resumint-app/1.0",
        },
      }
    )

    if (ghRes.status === 404) {
      res.status(404).json({ error: "GitHub user not found" })
      return
    }

    if (ghRes.status === 403) {
      res.status(429).json({ error: "GitHub API rate limit exceeded. Try again later." })
      return
    }

    if (!ghRes.ok) {
      res.status(ghRes.status).json({ error: "GitHub API error" })
      return
    }

    const repos: Array<{
      name: string
      description: string | null
      html_url: string
      language: string | null
      stargazers_count: number
      fork: boolean
    }> = await ghRes.json()

    const filtered = repos
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
      }))

    res.json({ repos: filtered })
  } catch (e) {
    console.error("GitHub repos error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

router.post("/projects/github-import", requireSession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session
    const validation = importSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(422).json({ error: "Invalid request", details: validation.error.flatten() })
      return
    }

    const result = await container.githubUseCases.importRepos(session.user.id, validation.data.repos)
    res.json(result)
  } catch (e) {
    console.error("GitHub import error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

export default router
