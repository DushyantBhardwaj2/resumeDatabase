import type { Profile } from "./entities"

export interface IProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>
  upsert(userId: string, data: Partial<Profile>): Promise<Profile>
  saveRaw(userId: string, rawText: string, parsed: Profile): Promise<Profile>
}

export interface ITailoredResumeRepository {
  create(data: {
    userId: string
    companyName: string
    jobTitle: string
    jobDescription: string
    tailoredData: unknown
  }): Promise<void>
  findByUserId(
    userId: string,
    search?: string
  ): Promise<Array<{ id: string; companyName: string; jobTitle: string; createdAt: Date }>>
  findById(id: string, userId: string): Promise<unknown | null>
  deleteById(id: string, userId: string): Promise<void>
  updateStyling(id: string, userId: string, styleConfig: Record<string, unknown>): Promise<void>
}

export interface IGitHubRepoRepository {
  upsertRepos(
    userId: string,
    repos: Array<{ repoName: string; repoUrl: string; techStack: string[]; bulletsGenerated: string[] }>
  ): Promise<void>
}
