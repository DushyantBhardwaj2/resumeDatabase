import type { Profile, ResumeDraft, ResumeSelection, EntrySummary, MemoryType } from "./entities"
import type { DomainExperience, DomainProject, DomainEducation, DomainSkill, DomainCertificate, DomainAchievement, DomainBullet, DomainRawMemory } from "./entities"

// ── Legacy (KEEP temporarily — removed in Phase 4) ────────────────────────────

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

// ── Phase 6: New Repository Interfaces ─────────────────────────────────────────

export interface IChatRepository {
  save(message: { userId: string; role: string; content: string }): Promise<{ id: string; userId: string; role: string; content: string; createdAt: Date }>
  findByUserId(userId: string, limit?: number): Promise<Array<{ id: string; userId: string; role: string; content: string; createdAt: Date }>>
  clearByUserId(userId: string): Promise<void>
}

export interface IExperienceRepository {
  findByUserId(userId: string): Promise<DomainExperience[]>
  findById(id: string): Promise<DomainExperience | null>
  create(data: Omit<DomainExperience, "id" | "createdAt" | "updatedAt">): Promise<DomainExperience>
  update(id: string, data: Partial<DomainExperience>): Promise<DomainExperience>
  delete(id: string): Promise<void>
}

export interface IProjectRepository {
  findByUserId(userId: string): Promise<DomainProject[]>
  findById(id: string): Promise<DomainProject | null>
  create(data: Omit<DomainProject, "id" | "createdAt" | "updatedAt">): Promise<DomainProject>
  update(id: string, data: Partial<DomainProject>): Promise<DomainProject>
  delete(id: string): Promise<void>
}

export interface IEducationRepository {
  findByUserId(userId: string): Promise<DomainEducation[]>
  findById(id: string): Promise<DomainEducation | null>
  create(data: Omit<DomainEducation, "id">): Promise<DomainEducation>
  update(id: string, data: Partial<DomainEducation>): Promise<DomainEducation>
  delete(id: string): Promise<void>
}

export interface ISkillRepository {
  findByUserId(userId: string): Promise<DomainSkill[]>
  findById(id: string): Promise<DomainSkill | null>
  create(data: Omit<DomainSkill, "id">): Promise<DomainSkill>
  update(id: string, data: Partial<DomainSkill>): Promise<DomainSkill>
  delete(id: string): Promise<void>
  upsertByUserId(userId: string, name: string, data: Partial<DomainSkill>): Promise<DomainSkill>
}

export interface ICertificateRepository {
  findByUserId(userId: string): Promise<DomainCertificate[]>
  findById(id: string): Promise<DomainCertificate | null>
  create(data: Omit<DomainCertificate, "id">): Promise<DomainCertificate>
  update(id: string, data: Partial<DomainCertificate>): Promise<DomainCertificate>
  delete(id: string): Promise<void>
}

export interface IAchievementRepository {
  findByUserId(userId: string): Promise<DomainAchievement[]>
  findById(id: string): Promise<DomainAchievement | null>
  create(data: Omit<DomainAchievement, "id">): Promise<DomainAchievement>
  update(id: string, data: Partial<DomainAchievement>): Promise<DomainAchievement>
  delete(id: string): Promise<void>
}

export interface IBulletRepository {
  findByParent(parentType: string, parentId: string): Promise<DomainBullet[]>
  create(data: Omit<DomainBullet, "id" | "createdAt" | "updatedAt">): Promise<DomainBullet>
  update(id: string, data: Partial<DomainBullet>): Promise<DomainBullet>
  delete(id: string): Promise<void>
  deleteByParent(parentType: string, parentId: string): Promise<void>
}

export interface IResumeDraftRepository {
  findByUserId(userId: string): Promise<ResumeDraft[]>
  findById(id: string): Promise<ResumeDraft | null>
  create(data: Omit<ResumeDraft, "id" | "createdAt" | "updatedAt">): Promise<ResumeDraft>
  update(id: string, data: Partial<ResumeDraft>): Promise<ResumeDraft>
  delete(id: string): Promise<void>
}

export interface IRawMemoryRepository {
  findByUserId(userId: string): Promise<DomainRawMemory[]>
  findById(id: string): Promise<DomainRawMemory | null>
  create(data: Omit<DomainRawMemory, "id">): Promise<DomainRawMemory>
  delete(id: string): Promise<void>
}

// Generic memory repository for polymorphic operations
export interface IMemoryRepository {
  getEntry(type: MemoryType, id: string): Promise<DomainExperience | DomainProject | DomainEducation | DomainSkill | DomainCertificate | DomainAchievement | null>
  deleteEntry(type: MemoryType, id: string): Promise<void>
  search(userId: string, query?: string): Promise<EntrySummary[]>
}
