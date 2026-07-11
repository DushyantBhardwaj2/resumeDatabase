import { z } from 'zod';

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

export const vaultBulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: BulletCategoryEnum.optional(),
  keywords: z.array(z.string()).default([]),
  isAIGenerated: z.boolean().default(false),
});

export type VaultBullet = z.infer<typeof vaultBulletSchema>;

export const contactSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  linkedin: z.string().nullable(),
  github: z.string().nullable(),
  leetcode: z.string().nullable().optional(),
  portfolio: z.string().nullable(),

  names: z.array(z.string()).default([]).optional(),
  emails: z.array(z.string()).default([]).optional(),
  phones: z.array(z.string()).default([]).optional(),
  linkedins: z.array(z.string()).default([]).optional(),
  githubs: z.array(z.string()).default([]).optional(),
  leetcodes: z.array(z.string()).default([]).optional(),
  portfolios: z.array(z.string()).default([]).optional(),
});

export type Contact = z.infer<typeof contactSchema>;

export const educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  gpa: z.string().nullable(),
  startYear: z.number().nullable(),
  endYear: z.number().nullable(),
});

export type Education = z.infer<typeof educationSchema>;

// ── Extra-Curricular Schema ────────────────────────────────────────────────────

export const extracurricularItemSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  title: z.string(),
  description: z.string(),
  date: z.string().nullable().optional(),
});

export type ExtracurricularItem = z.infer<typeof extracurricularItemSchema>;

export const skillsSchema = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string()),
});

export type Skills = z.infer<typeof skillsSchema>;

export const certificateSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  url: z.string(),
  date: z.string().optional(),
});

export type Certificate = z.infer<typeof certificateSchema>;

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

export const profileSchema = z.object({
  contact: contactSchema,
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
  skills: skillsSchema,
  certificates: z.array(certificateSchema).default([]),
  extracurriculars: z.array(extracurricularItemSchema).default([]),
  githubUsername: z.string().nullable().optional(),
});

export type Profile = z.infer<typeof profileSchema>;

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
  selectedExperienceIds: z.array(z.string()),
  selectedProjectIds: z.array(z.string()),
  selections: z.record(z.string(), z.array(z.string())),
  skills: skillsSchema.optional(),
  rationale: z.string(),
});

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
