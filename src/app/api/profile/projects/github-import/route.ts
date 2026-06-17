import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import type { Profile } from "@/core/domain/entities"
import { z } from "zod"
import { NextRequest } from "next/server"

const importSchema = z.object({
  repos: z.array(z.object({ name: z.string(), url: z.string(), language: z.string().nullable() })),
})

const README_BULLET_PROMPT = `You are a resume-writing expert. Given a GitHub repository name, its primary language, and its README content, generate 2-3 concise, achievement-oriented bullet points suitable for a resume project section. Focus on what was built, the technologies used, and the impact. Return ONLY a JSON array of strings — no markdown, no explanation.`

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const validation = importSchema.safeParse(body)
    if (!validation.success) {
      return Response.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 422 }
      )
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

    return Response.json({ imported: importedProjects.length, projects: mergedProjects })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("GitHub import error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
