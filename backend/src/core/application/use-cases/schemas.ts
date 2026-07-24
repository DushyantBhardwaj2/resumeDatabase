import { z } from "zod"

export const intentClassifySchema = z.object({
  intent: z.enum(["CREATE_MEMORY", "UPDATE_MEMORY", "DELETE_MEMORY", "CREATE_RESUME", "SEARCH_MEMORY", "GENERAL_CHAT"]),
  confidence: z.number().min(0).max(1),
  contextHint: z.string().optional(),
})

export const jdParserSchema = z.object({
  role: z.string(),
  company: z.string().optional(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  experienceLevel: z.enum(["intern", "entry", "mid", "senior", "lead"]),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
})

export const bulletSelectSchema = z.object({
  selections: z.array(z.object({
    entryId: z.string(),
    entryType: z.enum(["experience", "project", "education"]),
    confidence: z.number().min(0).max(1),
    rank: z.number().min(1),
    rationale: z.string(),
    selectedBulletIds: z.array(z.string()),
  })),
})

export const memoryExtractSchema = z.object({
  actions: z.array(z.any()),
})

export const entryExpandSchema = z.object({
  bullets: z.array(z.object({
    text: z.string(),
    order: z.number().optional(),
    keywords: z.array(z.string()).default([]),
  })),
})

export const mergeDetectSchema = z.object({
  shouldMerge: z.boolean(),
  rationale: z.string(),
})

export const skillExtractSchema = z.object({
  skills: z.array(z.string()),
})
