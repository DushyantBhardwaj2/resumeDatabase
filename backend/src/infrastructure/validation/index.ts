import { z } from "zod"
import type { ISchema } from "../../core/application/ports/ai-service"

// ── Vault Bullet Schema ───────────────────────────────────────────────────────

export const vaultBulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]).optional(),
  keywords: z.array(z.string()).default([]),
  isAIGenerated: z.boolean().default(false),
})

export type VaultBulletType = z.infer<typeof vaultBulletSchema>

// ── Certificate Schema ────────────────────────────────────────────────────────

export const certificateSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  url: z.string(),
  date: z.string().optional(),
})

// ── AI Section Schemas (used by AiUseCases) ──────────────────────────────────

// Backward-compatible: accepts both `bullets: string[]` and `vaultBullets: VaultBullet[]`
const legacyBulletsSchema: ISchema<{ vaultBullets: VaultBulletType[] }> = z.object({
  vaultBullets: z.array(vaultBulletSchema).default([]),
  bullets: z.array(z.string()).optional(),
}).transform((val) => {
  if (val.vaultBullets.length > 0) return { vaultBullets: val.vaultBullets }
  if (val.bullets && val.bullets.length > 0) {
    return {
      vaultBullets: val.bullets.map((b: string) => ({
        id: crypto.randomUUID(),
        text: b,
        keywords: [],
        isAIGenerated: true,
      }))
    }
  }
  return { vaultBullets: [] }
})

export const bulletsSchema: ISchema<{ vaultBullets: VaultBulletType[] }> = legacyBulletsSchema
export const skillsSchema: ISchema<{ languages: string[]; frameworks: string[]; tools: string[] }> = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string()),
})
export const summarySchema: ISchema<{ summary: string }> = z.object({ summary: z.string() })
export const projectSchema: ISchema<{ title: string; url: string | null; techStack: string[]; vaultBullets: VaultBulletType[] }> = z.object({
  title: z.string(),
  url: z.string().nullable(),
  techStack: z.array(z.string()),
  vaultBullets: z.array(vaultBulletSchema).default([]),
  bulletPoints: z.array(z.string()).optional(),
}).transform((val) => ({
  ...val,
  vaultBullets: val.vaultBullets.length > 0
    ? val.vaultBullets
    : (val.bulletPoints || []).map((b: string) => ({
        id: crypto.randomUUID(),
        text: b,
        keywords: [],
        isAIGenerated: true,
      })),
}))

export const experienceEntrySchema: ISchema<{ company: string; role: string; startDate: string | null; endDate: string | null; vaultBullets: VaultBulletType[] }> = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  vaultBullets: z.array(vaultBulletSchema).default([]),
  bulletPoints: z.array(z.string()).optional(),
}).transform((val) => ({
  ...val,
  vaultBullets: val.vaultBullets.length > 0
    ? val.vaultBullets
    : (val.bulletPoints || []).map((b: string) => ({
        id: crypto.randomUUID(),
        text: b,
        keywords: [],
        isAIGenerated: true,
      })),
}))

export const SECTION_SCHEMAS: Record<string, ISchema<unknown>> = {
  experience: bulletsSchema,
  projects: bulletsSchema,
  skills: skillsSchema,
  summary: summarySchema,
  experience_entry: experienceEntrySchema,
  project: projectSchema,
}

// ── Resume Parse Schema ───────────────────────────────────────────────────────

export const parsedResumeSchema = z.object({
  contact: z.object({
    phone: z.string().nullable(),
    linkedin: z.string().nullable(),
    github: z.string().nullable(),
    portfolio: z.string().nullable(),
  }),
  education: z.array(
    z.object({ school: z.string(), degree: z.string(), gpa: z.string().nullable(), startYear: z.number().nullable(), endYear: z.number().nullable() })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      vaultBullets: z.array(vaultBulletSchema).default([]),
      bullets: z.array(z.string()).optional(),
    }).transform((val) => ({
      ...val,
      vaultBullets: val.vaultBullets.length > 0
        ? val.vaultBullets
        : (val.bullets || []).map((b: string) => ({
            id: crypto.randomUUID(),
            text: b,
            keywords: [],
            isAIGenerated: true,
          })),
    }))
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      techStack: z.array(z.string()),
      vaultBullets: z.array(vaultBulletSchema).default([]),
      bullets: z.array(z.string()).optional(),
      url: z.string().nullable(),
    }).transform((val) => ({
      ...val,
      vaultBullets: val.vaultBullets.length > 0
        ? val.vaultBullets
        : (val.bullets || []).map((b: string) => ({
            id: crypto.randomUUID(),
            text: b,
            keywords: [],
            isAIGenerated: true,
          })),
    }))
  ),
  skills: z.object({ languages: z.array(z.string()), frameworks: z.array(z.string()), tools: z.array(z.string()) }),
})

export const tailorOutputSchema = z.object({
  summary: z.string().nullable(),
  experience: z.array(
    z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), vaultBullets: z.array(vaultBulletSchema).default([]) })
  ),
  projects: z.array(
    z.object({ title: z.string(), techStack: z.array(z.string()), vaultBullets: z.array(vaultBulletSchema).default([]), url: z.string().nullable() })
  ),
  skills: z.object({ languages: z.array(z.string()), frameworks: z.array(z.string()), tools: z.array(z.string()) }),
})

export const bulletSelectionSchema = z.object({
  selections: z.record(z.string(), z.array(z.string())),
  rationale: z.string(),
})
