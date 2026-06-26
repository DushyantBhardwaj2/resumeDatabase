import { prisma } from "../../config/prisma"
import type { Profile, Experience, Project, VaultBullet } from "../../core/domain/entities"
import type { IProfileRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function migrateBullets(bullets: unknown): VaultBullet[] {
  if (!bullets) return []
  if (Array.isArray(bullets) && bullets.length > 0 && typeof bullets[0] === "object" && "id" in bullets[0]) {
    return bullets as VaultBullet[]
  }
  return (bullets as string[]).map((b: string) => ({
    id: crypto.randomUUID(),
    text: b,
    keywords: [],
    isAIGenerated: false,
  }))
}

function migrateExperience(raw: unknown): Experience[] {
  if (!raw) return []
  return (raw as any[]).map((e) => ({
    ...e,
    vaultBullets: migrateBullets(e.vaultBullets ?? e.bullets),
  }))
}

function migrateProjects(raw: unknown): Project[] {
  if (!raw) return []
  return (raw as any[]).map((p) => ({
    ...p,
    vaultBullets: migrateBullets(p.vaultBullets ?? p.bullets),
  }))
}

export class ProfileRepository implements IProfileRepository {
  async findByUserId(userId: string): Promise<Profile | null> {
    const row = await prisma.profile.findUnique({ where: { userId } })
    if (!row) return null
    return {
      contact: row.contact as unknown as Profile["contact"],
      education: row.education as unknown as Profile["education"],
      experience: migrateExperience(row.experience),
      projects: migrateProjects(row.projects),
      skills: row.skills as unknown as Profile["skills"],
      certificates: (row.certificates as unknown as Profile["certificates"]) ?? [],
      githubUsername: row.githubUsername,
    }
  }

  async upsert(userId: string, data: Partial<Profile>): Promise<Profile> {
    const updateData: Record<string, unknown> = {}
    if (data.contact !== undefined) updateData.contact = toJson(data.contact)
    if (data.education !== undefined) updateData.education = toJson(data.education)
    if (data.experience !== undefined) updateData.experience = toJson(data.experience)
    if (data.projects !== undefined) updateData.projects = toJson(data.projects)
    if (data.skills !== undefined) updateData.skills = toJson(data.skills)
    if (data.certificates !== undefined) updateData.certificates = toJson(data.certificates)
    if (data.githubUsername !== undefined) updateData.githubUsername = data.githubUsername

    const row = await prisma.profile.upsert({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { userId, ...updateData } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: updateData as any,
    })
    return {
      contact: row.contact as unknown as Profile["contact"],
      education: row.education as unknown as Profile["education"],
      experience: migrateExperience(row.experience),
      projects: migrateProjects(row.projects),
      skills: row.skills as unknown as Profile["skills"],
      certificates: (row.certificates as unknown as Profile["certificates"]) ?? [],
      githubUsername: row.githubUsername,
    }
  }

  async saveRaw(userId: string, rawText: string, parsed: Profile): Promise<Profile> {
    const data = {
      rawResumeText: rawText,
      contact: toJson(parsed.contact),
      education: toJson(parsed.education),
      experience: toJson(parsed.experience),
      projects: toJson(parsed.projects),
      skills: toJson(parsed.skills),
      certificates: toJson(parsed.certificates),
    }
    const row = await prisma.profile.upsert({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { userId, ...data } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: data as any,
    })
    return {
      contact: row.contact as unknown as Profile["contact"],
      education: row.education as unknown as Profile["education"],
      experience: migrateExperience(row.experience),
      projects: migrateProjects(row.projects),
      skills: row.skills as unknown as Profile["skills"],
      certificates: (row.certificates as unknown as Profile["certificates"]) ?? [],
      githubUsername: row.githubUsername,
    }
  }
}
