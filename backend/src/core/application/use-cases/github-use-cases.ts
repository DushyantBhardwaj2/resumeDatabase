import type { IGitHubRepoRepository, IProfileRepository } from "../../domain/repositories"
import type { IAIService, ISchema } from "../ports/ai-service"
import type { Profile, VaultBullet } from "../../domain/entities"

function bulletsToVault(bullets: string[], isAIGenerated = true): VaultBullet[] {
  return bullets.map((b) => ({
    id: crypto.randomUUID(),
    text: b,
    keywords: [],
    isAIGenerated,
  }))
}

export class GithubUseCases {
  constructor(
    private githubRepo: IGitHubRepoRepository,
    private profileRepo: IProfileRepository,
    private aiService: IAIService,
    private readmeBulletPrompt: string,
    private arraySchema: ISchema<string[]>
  ) {}

  async importRepos(
    userId: string,
    repos: Array<{ name: string; url: string; language: string | null }>
  ): Promise<{ imported: number; projects: Profile["projects"] }> {
    const importedProjects: Profile["projects"] = []

    for (const repo of repos) {
      let bullets: string[] = []
      try {
        const readmeRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(repo.url.replace("https://github.com/", ""))}/readme`,
          { headers: { Accept: "application/vnd.github.v3.raw", "User-Agent": "resumint-app/1.0" } }
        )
        const readmeContent = readmeRes.ok ? (await readmeRes.text()).slice(0, 3000) : ""
        const content = `Repo: ${repo.name}\nLanguage: ${repo.language ?? "N/A"}\n\nREADME:\n${readmeContent}`
        bullets = await this.aiService.generateStructuredData(this.readmeBulletPrompt, content, this.arraySchema)
      } catch {
        bullets = [`Built and maintained ${repo.name} using ${repo.language ?? "various technologies"}.`]
      }

      const vaultBullets = bulletsToVault(bullets)
      await this.githubRepo.upsertRepos(userId, [
        { repoName: repo.name, repoUrl: repo.url, techStack: repo.language ? [repo.language] : [], bulletsGenerated: bullets },
      ])

      importedProjects.push({ id: crypto.randomUUID(), title: repo.name, techStack: repo.language ? [repo.language] : [], vaultBullets, url: repo.url })
    }

    const profile = await this.profileRepo.findByUserId(userId)
    const existingUrls = new Set(profile?.projects?.map((p) => p.url) ?? [])
    const mergedProjects = [...importedProjects.filter((p) => !existingUrls.has(p.url)), ...(profile?.projects ?? [])]
    await this.profileRepo.upsert(userId, { projects: mergedProjects })

    return { imported: importedProjects.length, projects: mergedProjects }
  }
}
