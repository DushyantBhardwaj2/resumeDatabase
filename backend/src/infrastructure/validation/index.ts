import { z } from "zod"
import type { ISchema } from "../../core/application/ports/ai-service"

// ── AI Section Schemas (used by AiUseCases) ──────────────────────────────────

export const bulletsSchema: ISchema<{ bullets: string[] }> = z.object({ bullets: z.array(z.string()) })
export const skillsSchema: ISchema<{ languages: string[]; frameworks: string[]; tools: string[] }> = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string()),
})
export const summarySchema: ISchema<{ summary: string }> = z.object({ summary: z.string() })
export const projectSchema: ISchema<{ title: string; url: string | null; techStack: string[]; bulletPoints: string[] }> = z.object({
  title: z.string(),
  url: z.string().nullable(),
  techStack: z.array(z.string()),
  bulletPoints: z.array(z.string()),
})
export const experienceEntrySchema: ISchema<{ company: string; role: string; startDate: string | null; endDate: string | null; bulletPoints: string[] }> = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bulletPoints: z.array(z.string()),
})

export const SECTION_SCHEMAS: Record<string, ISchema<unknown>> = {
  experience: bulletsSchema,
  projects: bulletsSchema,
  skills: skillsSchema,
  summary: summarySchema,
  experience_entry: experienceEntrySchema,
  project: projectSchema,
}

// ── Resume Parse Schema (used by ResumeUseCases + routes) ────────────────────

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
    z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), bullets: z.array(z.string()) })
  ),
  projects: z.array(
    z.object({ title: z.string(), techStack: z.array(z.string()), bullets: z.array(z.string()), url: z.string().nullable() })
  ),
  skills: z.object({ languages: z.array(z.string()), frameworks: z.array(z.string()), tools: z.array(z.string()) }),
})

export const tailorOutputSchema = z.object({
  summary: z.string().nullable(),
  experience: z.array(
    z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), bullets: z.array(z.string()) })
  ),
  projects: z.array(
    z.object({ title: z.string(), techStack: z.array(z.string()), bullets: z.array(z.string()), url: z.string().nullable() })
  ),
  skills: z.object({ languages: z.array(z.string()), frameworks: z.array(z.string()), tools: z.array(z.string()) }),
})
