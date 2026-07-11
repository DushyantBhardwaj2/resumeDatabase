import { prisma } from "../../config/prisma"
import type { Profile, Experience, Project, VaultBullet } from "../../core/domain/entities"
import type { IProfileRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

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

// ── Zod Schemas for resilient DB reads ────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().nullable().catch(null),
  email: z.string().nullable().catch(null),
  phone: z.string().nullable().catch(null),
  linkedin: z.string().nullable().catch(null),
  github: z.string().nullable().catch(null),
  leetcode: z.string().nullable().catch(null),
  portfolio: z.string().nullable().catch(null),
}).catch({ name: null, email: null, phone: null, linkedin: null, github: null, leetcode: null, portfolio: null })

const educationSchema = z.object({
  school: z.string().catch(""),
  degree: z.string().catch(""),
  gpa: z.string().nullable().catch(null),
  startYear: z.number().nullable().catch(null),
  endYear: z.number().nullable().catch(null),
})

const vaultBulletSchema = z.object({
  id: z.string().catch(() => crypto.randomUUID()),
  text: z.string().catch(""),
  category: z.enum(['FRONTEND', 'BACKEND', 'DEVOPS', 'LEADERSHIP', 'GENERAL']).optional(),
  keywords: z.array(z.string()).catch([]),
  isAIGenerated: z.boolean().catch(false),
})

const experienceSchema = z.object({
  id: z.string().catch(() => crypto.randomUUID()),
  company: z.string().catch(""),
  role: z.string().catch(""),
  startDate: z.string().nullable().catch(null),
  endDate: z.string().nullable().catch(null),
  vaultBullets: z.array(vaultBulletSchema).catch([]),
})

const projectSchema = z.object({
  id: z.string().catch(() => crypto.randomUUID()),
  title: z.string().catch(""),
  techStack: z.array(z.string()).catch([]),
  vaultBullets: z.array(vaultBulletSchema).catch([]),
  url: z.string().nullable().catch(null),
})

const skillsSchema = z.object({
  languages: z.array(z.string()).catch([]),
  frameworks: z.array(z.string()).catch([]),
  tools: z.array(z.string()).catch([]),
}).catch({ languages: [], frameworks: [], tools: [] })

const certificateSchema = z.object({
  id: z.string().catch(() => crypto.randomUUID()),
  name: z.string().catch(""),
  issuer: z.string().catch(""),
  url: z.string().catch(""),
  date: z.string().optional(),
})

const extracurricularItemSchema = z.object({
  id: z.string().catch(() => crypto.randomUUID()),
  title: z.string().catch(""),
  description: z.string().catch(""),
  date: z.string().nullable().catch(null),
})

// Safe mapper to ensure drift doesn't crash the app
function mapRowToProfile(row: any): Profile {
  return {
    contact: contactSchema.parse(row.contact || {}),
    education: z.array(educationSchema).catch([]).parse(row.education || []),
    experience: z.array(experienceSchema).catch([]).parse(migrateExperience(row.experience)),
    projects: z.array(projectSchema).catch([]).parse(migrateProjects(row.projects)),
    skills: skillsSchema.parse(row.skills || {}),
    certificates: z.array(certificateSchema).catch([]).parse(row.certificates || []),
    extracurriculars: z.array(extracurricularItemSchema).catch([]).parse(row.extracurriculars || []),
    githubUsername: typeof row.githubUsername === 'string' ? row.githubUsername : null,
  }
}

export class ProfileRepository implements IProfileRepository {
  async findByUserId(userId: string): Promise<Profile | null> {
    const row = await prisma.profile.findUnique({ where: { userId } })
    if (!row) return null
    return mapRowToProfile(row)
  }

  async upsert(userId: string, data: Partial<Profile>): Promise<Profile> {
    const updateData: Record<string, unknown> = {}
    if (data.contact !== undefined) updateData.contact = toJson(data.contact)
    if (data.education !== undefined) updateData.education = toJson(data.education)
    if (data.experience !== undefined) updateData.experience = toJson(data.experience)
    if (data.projects !== undefined) updateData.projects = toJson(data.projects)
    if (data.skills !== undefined) updateData.skills = toJson(data.skills)
    if (data.certificates !== undefined) updateData.certificates = toJson(data.certificates)
    if (data.extracurriculars !== undefined) updateData.extracurriculars = toJson(data.extracurriculars)
    if (data.githubUsername !== undefined) updateData.githubUsername = data.githubUsername

    const row = await prisma.profile.upsert({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { userId, ...updateData } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: updateData as any,
    })
    return mapRowToProfile(row)
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
      extracurriculars: toJson(parsed.extracurriculars ?? []),
    }
    const row = await prisma.profile.upsert({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { userId, ...data } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: data as any,
    })
    return mapRowToProfile(row)
  }
}
