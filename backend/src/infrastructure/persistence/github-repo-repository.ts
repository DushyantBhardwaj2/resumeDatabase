import { prisma } from "../../config/prisma"
import type { IGitHubRepoRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export class GitHubRepoRepository implements IGitHubRepoRepository {
  async upsertRepos(
    userId: string,
    repos: Array<{ repoName: string; repoUrl: string; techStack: string[]; bulletsGenerated: string[] }>
  ): Promise<void> {
    for (const repo of repos) {
      await prisma.gitHubRepo.upsert({
        where: { userId_repoUrl: { userId, repoUrl: repo.repoUrl } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: { userId, repoName: repo.repoName, repoUrl: repo.repoUrl, techStack: toJson(repo.techStack), bulletsGenerated: toJson(repo.bulletsGenerated) } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: { techStack: toJson(repo.techStack), bulletsGenerated: toJson(repo.bulletsGenerated), syncedAt: new Date() } as any,
      })
    }
  }
}
