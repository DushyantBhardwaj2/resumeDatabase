import { Router, Request, Response } from "express"
import { requireSession } from "../middleware/auth"
import { container } from "../di/container"
import type { Profile } from "../core/domain/entities"
import { z } from "zod"

const router = Router()

const importSchema = z.object({
  repos: z.array(z.object({ name: z.string(), url: z.string(), language: z.string().nullable() })),
})

const README_BULLET_PROMPT = `You are a resume-writing expert. Given a GitHub repository name, its primary language, and its README content, generate 2-3 concise, achievement-oriented bullet points suitable for a resume project section. Focus on what was built, the technologies used, and the impact. Return ONLY a JSON array of strings — no markdown, no explanation.`

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

    const { repos } = validation.data
    const importedProjects: Array<{ title: string; techStack: string[]; bullets: string[]; url: string }> = []

    for (const repo of repos) {
      let bullets: string[] = []
      try {
        const readmeRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(repo.url.replace("https://github.com/", ""))}/readme`,
          { headers: { Accept: "application/vnd.github.v3.raw", "User-Agent": "resumint-app/1.0" } }
        )
        const readmeContent = readmeRes.ok ? (await readmeRes.text()).slice(0, 3000) : ""
        const content = `Repo: ${repo.name}\nLanguage: ${repo.language ?? "N/A"}\n\nREADME:\n${readmeContent}`
        bullets = await container.aiService.generateStructuredData<string[]>(README_BULLET_PROMPT, content, z.array(z.string()))
      } catch {
        bullets = [`Built and maintained ${repo.name} using ${repo.language ?? "various technologies"}.`]
      }

      await container.githubRepo.upsertRepos(session.user.id, [
        { repoName: repo.name, repoUrl: repo.url, techStack: repo.language ? [repo.language] : [], bulletsGenerated: bullets },
      ])

      importedProjects.push({ title: repo.name, techStack: repo.language ? [repo.language] : [], bullets, url: repo.url })
    }

    const profile = await container.profileUseCases.getProfile(session.user.id)
    const mergedProjects = [...importedProjects, ...(profile?.projects ?? [])]
    await container.profileUseCases.updateProfile(session.user.id, { projects: mergedProjects as unknown as Profile["projects"] })

    res.json({ imported: importedProjects.length, projects: mergedProjects })
  } catch (e) {
    console.error("GitHub import error:", e)
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal server error" })
  }
})

export default router
