import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStructuredData } from "@/lib/ai"
import { z } from "zod"
import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"

const importSchema = z.object({
  repos: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      language: z.string().nullable(),
    })
  ),
})

const readmeBulletPrompt = `You are a resume-writing expert. Given a GitHub repository name, its primary language, and its README content, generate 2-3 concise, achievement-oriented bullet points suitable for a resume project section. Focus on what was built, the technologies used, and the impact. Return ONLY a JSON array of strings — no markdown, no explanation.`

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = importSchema.safeParse(body)
    if (!validation.success) {
      return Response.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const { repos } = validation.data

    const importedProjects: Array<{
      title: string
      techStack: string[]
      bullets: string[]
      url: string
    }> = []

    for (const repo of repos) {
      const existing = await prisma.gitHubRepo.findFirst({
        where: { userId: session.user.id, repoUrl: repo.url },
      })

      if (existing && existing.bulletsGenerated) {
        importedProjects.push({
          title: repo.name,
          techStack: repo.language ? [repo.language] : [],
          bullets: existing.bulletsGenerated as string[],
          url: repo.url,
        })
        continue
      }

      let readmeContent = ""
      try {
        const readmeRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(repo.url.replace("https://github.com/", ""))}/readme`,
          {
            headers: {
              Accept: "application/vnd.github.v3.raw",
              "User-Agent": "resumint-app/1.0",
            },
          }
        )
        if (readmeRes.ok) {
          readmeContent = await readmeRes.text()
        }
      } catch {
        // README fetch failed — use description-less prompt
      }

      let bullets: string[] = []
      try {
        const content = `Repo: ${repo.name}\nLanguage: ${repo.language ?? "N/A"}\n\nREADME:\n${readmeContent.slice(0, 3000)}`
        bullets = await generateStructuredData<string[]>(
          readmeBulletPrompt,
          content,
          z.array(z.string())
        )
      } catch {
        bullets = [`Built and maintained ${repo.name} using ${repo.language ?? "various technologies"}.`]
      }

      await prisma.gitHubRepo.upsert({
        where: {
          userId_repoUrl: { userId: session.user.id, repoUrl: repo.url },
        },
        create: {
          userId: session.user.id,
          repoName: repo.name,
          repoUrl: repo.url,
          techStack: repo.language ? [repo.language] : [],
          bulletsGenerated: bullets,
        },
        update: {
          repoName: repo.name,
          techStack: repo.language ? [repo.language] : [],
          bulletsGenerated: bullets,
          syncedAt: new Date(),
        },
      })

      importedProjects.push({
        title: repo.name,
        techStack: repo.language ? [repo.language] : [],
        bullets,
        url: repo.url,
      })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    const existingProjects = (profile?.projects as Array<Record<string, unknown>> | null) ?? []
    const mergedProjects = [...importedProjects, ...existingProjects]

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { projects: mergedProjects as unknown as Prisma.InputJsonValue },
    })

    return Response.json({
      imported: importedProjects.length,
      projects: mergedProjects,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("GitHub import error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
