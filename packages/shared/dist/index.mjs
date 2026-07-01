// src/index.ts
import { z } from "zod";
var BulletCategoryEnum = z.enum(["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]);
var SectionNameEnum = z.enum(["contact", "education", "experience", "projects", "skills", "certificates"]);
var SECTION_LABELS = {
  contact: "Contact Info",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  certificates: "Certificates"
};
var SECTION_ORDER = [
  "contact",
  "education",
  "experience",
  "projects",
  "skills",
  "certificates"
];
var vaultBulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: BulletCategoryEnum.optional(),
  keywords: z.array(z.string()).default([]),
  isAIGenerated: z.boolean().default(false)
});
var contactSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  linkedin: z.string().nullable(),
  github: z.string().nullable(),
  leetcode: z.string().nullable().optional(),
  portfolio: z.string().nullable()
});
var educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  gpa: z.string().nullable(),
  startYear: z.number().nullable(),
  endYear: z.number().nullable()
});
var skillsSchema = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string())
});
var certificateSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  url: z.string(),
  date: z.string().optional()
});
var experienceSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  company: z.string(),
  role: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  current: z.boolean().default(false).optional(),
  vaultBullets: z.array(vaultBulletSchema).default([])
});
var experienceEntrySchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  vaultBullets: z.array(vaultBulletSchema).default([]),
  bulletPoints: z.array(z.string()).optional()
}).transform((val) => ({
  ...val,
  vaultBullets: val.vaultBullets.length > 0 ? val.vaultBullets : (val.bulletPoints || []).map((b) => ({
    id: crypto.randomUUID(),
    text: b,
    keywords: [],
    isAIGenerated: true
  }))
}));
var projectSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  title: z.string(),
  url: z.string().nullable(),
  techStack: z.array(z.string()),
  vaultBullets: z.array(vaultBulletSchema).default([])
});
var projectEntrySchema = z.object({
  title: z.string(),
  url: z.string().nullable(),
  techStack: z.array(z.string()),
  vaultBullets: z.array(vaultBulletSchema).default([]),
  bulletPoints: z.array(z.string()).optional()
}).transform((val) => ({
  ...val,
  vaultBullets: val.vaultBullets.length > 0 ? val.vaultBullets : (val.bulletPoints || []).map((b) => ({
    id: crypto.randomUUID(),
    text: b,
    keywords: [],
    isAIGenerated: true
  }))
}));
var profileSchema = z.object({
  contact: contactSchema,
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
  skills: skillsSchema,
  certificates: z.array(certificateSchema).default([]),
  githubUsername: z.string().nullable().optional()
});
var legacyBulletsSchema = z.object({
  vaultBullets: z.array(vaultBulletSchema).default([]),
  bullets: z.array(z.string()).optional()
}).transform((val) => {
  if (val.vaultBullets.length > 0) return { vaultBullets: val.vaultBullets };
  if (val.bullets && val.bullets.length > 0) {
    return {
      vaultBullets: val.bullets.map((b) => ({
        id: crypto.randomUUID(),
        text: b,
        keywords: [],
        isAIGenerated: true
      }))
    };
  }
  return { vaultBullets: [] };
});
var bulletsSchema = legacyBulletsSchema;
var summarySchema = z.object({ summary: z.string() });
var SECTION_SCHEMAS = {
  experience: bulletsSchema,
  projects: bulletsSchema,
  skills: skillsSchema,
  summary: summarySchema,
  experience_entry: experienceEntrySchema,
  project: projectEntrySchema
};
var parsedResumeSchema = z.object({
  contact: contactSchema,
  education: z.array(educationSchema),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      vaultBullets: z.array(vaultBulletSchema).default([]),
      bullets: z.array(z.string()).optional()
    }).transform((val) => ({
      ...val,
      vaultBullets: val.vaultBullets.length > 0 ? val.vaultBullets : (val.bullets || []).map((b) => ({
        id: crypto.randomUUID(),
        text: b,
        keywords: [],
        isAIGenerated: true
      }))
    }))
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      techStack: z.array(z.string()),
      vaultBullets: z.array(vaultBulletSchema).default([]),
      bullets: z.array(z.string()).optional(),
      url: z.string().nullable()
    }).transform((val) => ({
      ...val,
      vaultBullets: val.vaultBullets.length > 0 ? val.vaultBullets : (val.bullets || []).map((b) => ({
        id: crypto.randomUUID(),
        text: b,
        keywords: [],
        isAIGenerated: true
      }))
    }))
  ),
  skills: skillsSchema
});
var tailorOutputSchema = z.object({
  summary: z.string().nullable(),
  experience: z.array(
    z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), vaultBullets: z.array(vaultBulletSchema).default([]) })
  ),
  projects: z.array(
    z.object({ title: z.string(), techStack: z.array(z.string()), vaultBullets: z.array(vaultBulletSchema).default([]), url: z.string().nullable() })
  ),
  skills: skillsSchema
});
var bulletSelectionSchema = z.object({
  selections: z.record(z.string(), z.array(z.string())),
  rationale: z.string()
});
export {
  BulletCategoryEnum,
  SECTION_LABELS,
  SECTION_ORDER,
  SECTION_SCHEMAS,
  SectionNameEnum,
  bulletSelectionSchema,
  bulletsSchema,
  certificateSchema,
  contactSchema,
  educationSchema,
  experienceEntrySchema,
  experienceSchema,
  parsedResumeSchema,
  profileSchema,
  projectEntrySchema,
  projectSchema,
  skillsSchema,
  summarySchema,
  tailorOutputSchema,
  vaultBulletSchema
};
