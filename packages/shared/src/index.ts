import { z } from 'zod';

// ── Enums & Constants ────────────────────────────────────────────────────────

export const BulletCategoryEnum = z.enum(["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]);
export type BulletCategory = z.infer<typeof BulletCategoryEnum>;

export const SectionNameEnum = z.enum(['contact', 'education', 'experience', 'projects', 'skills', 'certificates']);
export type SectionName = z.infer<typeof SectionNameEnum>;

export const SECTION_LABELS: Record<SectionName, string> = {
  contact: 'Contact Info',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  certificates: 'Certificates',
};

export const SECTION_ORDER: SectionName[] = [
  'contact',
  'education',
  'experience',
  'projects',
  'skills',
  'certificates',
];

// ── Vault Bullet Schema ───────────────────────────────────────────────────────

export const vaultBulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: BulletCategoryEnum.optional(),
  keywords: z.array(z.string()).default([]),
  isAIGenerated: z.boolean().default(false),
});

export type VaultBullet = z.infer<typeof vaultBulletSchema>;

// ── Contact Schema ────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  linkedin: z.string().nullable(),
  github: z.string().nullable(),
  leetcode: z.string().nullable().optional(),
  portfolio: z.string().nullable(),
});

export type Contact = z.infer<typeof contactSchema>;

// ── Education Schema ──────────────────────────────────────────────────────────

export const educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  gpa: z.string().nullable(),
  startYear: z.number().nullable(),
  endYear: z.number().nullable(),
});

export type Education = z.infer<typeof educationSchema>;

// ── Skills Schema ─────────────────────────────────────────────────────────────

export const skillsSchema = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string()),
});

export type Skills = z.infer<typeof skillsSchema>;

// ── Certificate Schema ────────────────────────────────────────────────────────

export const certificateSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  url: z.string(),
  date: z.string().optional(),
});

export type Certificate = z.infer<typeof certificateSchema>;

// ── Experience Schema ─────────────────────────────────────────────────────────

export const experienceSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  company: z.string(),
  role: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  current: z.boolean().default(false).optional(),
  vaultBullets: z.array(vaultBulletSchema).default([]),
});

export type Experience = z.infer<typeof experienceSchema>;

export const experienceEntrySchema = z.object({
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
}));

// ── Project Schema ────────────────────────────────────────────────────────────

export const projectSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  title: z.string(),
  url: z.string().nullable(),
  techStack: z.array(z.string()),
  vaultBullets: z.array(vaultBulletSchema).default([]),
});

export type Project = z.infer<typeof projectSchema>;

export const projectEntrySchema = z.object({
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
}));

// ── Profile Schema ────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  contact: contactSchema,
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
  skills: skillsSchema,
  certificates: z.array(certificateSchema).default([]),
  githubUsername: z.string().nullable().optional(),
});

export type Profile = z.infer<typeof profileSchema>;

// ── AI Section Schemas (used by AiUseCases) ──────────────────────────────────

const legacyBulletsSchema = z.object({
  vaultBullets: z.array(vaultBulletSchema).default([]),
  bullets: z.array(z.string()).optional(),
}).transform((val) => {
  if (val.vaultBullets.length > 0) return { vaultBullets: val.vaultBullets };
  if (val.bullets && val.bullets.length > 0) {
    return {
      vaultBullets: val.bullets.map((b: string) => ({
        id: crypto.randomUUID(),
        text: b,
        keywords: [],
        isAIGenerated: true,
      }))
    };
  }
  return { vaultBullets: [] };
});

export const bulletsSchema = legacyBulletsSchema;
export const summarySchema = z.object({ summary: z.string() });

export const SECTION_SCHEMAS: Record<string, z.ZodTypeAny> = {
  experience: bulletsSchema,
  projects: bulletsSchema,
  skills: skillsSchema,
  summary: summarySchema,
  experience_entry: experienceEntrySchema,
  project: projectEntrySchema,
};

// ── Legacy/Backend Resume Parse Schema ───────────────────────────────────────

export const parsedResumeSchema = z.object({
  contact: contactSchema,
  education: z.array(educationSchema),
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
  skills: skillsSchema,
});

export const tailorOutputSchema = z.object({
  summary: z.string().nullable(),
  experience: z.array(
    z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), vaultBullets: z.array(vaultBulletSchema).default([]) })
  ),
  projects: z.array(
    z.object({ title: z.string(), techStack: z.array(z.string()), vaultBullets: z.array(vaultBulletSchema).default([]), url: z.string().nullable() })
  ),
  skills: skillsSchema,
});

export const bulletSelectionSchema = z.object({
  selections: z.record(z.string(), z.array(z.string())),
  rationale: z.string(),
});

// ── Misc Interfaces ───────────────────────────────────────────────────────────

export interface TailoredOutput {
  summary: string | null
  experience: Experience[]
  projects: Project[]
  skills: Skills
}

export interface GitHubRepoInfo {
  name: string
  description: string | null
  url: string
  language: string | null
  stars: number
}

export interface AiGeneratedProject {
  title: string
  url: string | null
  techStack: string[]
  bulletPoints: string[]
}

export interface AiGeneratedExperience {
  company: string
  role: string
  startDate: string | null
  endDate: string | null
  bulletPoints: string[]
}

export type SectionType = "experience" | "projects" | "skills" | "summary" | "project" | "experience_entry"
