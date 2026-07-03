"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BulletCategoryEnum: () => BulletCategoryEnum,
  SECTION_LABELS: () => SECTION_LABELS,
  SECTION_ORDER: () => SECTION_ORDER,
  SECTION_SCHEMAS: () => SECTION_SCHEMAS,
  SectionNameEnum: () => SectionNameEnum,
  bulletSelectionSchema: () => bulletSelectionSchema,
  bulletsSchema: () => bulletsSchema,
  certificateSchema: () => certificateSchema,
  contactSchema: () => contactSchema,
  educationSchema: () => educationSchema,
  experienceEntrySchema: () => experienceEntrySchema,
  experienceSchema: () => experienceSchema,
  parsedResumeSchema: () => parsedResumeSchema,
  profileSchema: () => profileSchema,
  projectEntrySchema: () => projectEntrySchema,
  projectSchema: () => projectSchema,
  skillsSchema: () => skillsSchema,
  summarySchema: () => summarySchema,
  tailorOutputSchema: () => tailorOutputSchema,
  vaultBulletSchema: () => vaultBulletSchema
});
module.exports = __toCommonJS(index_exports);
var import_zod = require("zod");
var BulletCategoryEnum = import_zod.z.enum(["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]);
var SectionNameEnum = import_zod.z.enum(["contact", "education", "experience", "projects", "skills", "certificates"]);
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
var vaultBulletSchema = import_zod.z.object({
  id: import_zod.z.string(),
  text: import_zod.z.string(),
  category: BulletCategoryEnum.optional(),
  keywords: import_zod.z.array(import_zod.z.string()).default([]),
  isAIGenerated: import_zod.z.boolean().default(false)
});
var contactSchema = import_zod.z.object({
  name: import_zod.z.string().nullable(),
  email: import_zod.z.string().nullable(),
  phone: import_zod.z.string().nullable(),
  linkedin: import_zod.z.string().nullable(),
  github: import_zod.z.string().nullable(),
  leetcode: import_zod.z.string().nullable().optional(),
  portfolio: import_zod.z.string().nullable(),
  emails: import_zod.z.array(import_zod.z.string()).default([]).optional(),
  phones: import_zod.z.array(import_zod.z.string()).default([]).optional(),
  linkedins: import_zod.z.array(import_zod.z.string()).default([]).optional(),
  githubs: import_zod.z.array(import_zod.z.string()).default([]).optional(),
  portfolios: import_zod.z.array(import_zod.z.string()).default([]).optional()
});
var educationSchema = import_zod.z.object({
  school: import_zod.z.string(),
  degree: import_zod.z.string(),
  gpa: import_zod.z.string().nullable(),
  startYear: import_zod.z.number().nullable(),
  endYear: import_zod.z.number().nullable()
});
var skillsSchema = import_zod.z.object({
  languages: import_zod.z.array(import_zod.z.string()),
  frameworks: import_zod.z.array(import_zod.z.string()),
  tools: import_zod.z.array(import_zod.z.string())
});
var certificateSchema = import_zod.z.object({
  id: import_zod.z.string(),
  name: import_zod.z.string(),
  issuer: import_zod.z.string(),
  url: import_zod.z.string(),
  date: import_zod.z.string().optional()
});
var experienceSchema = import_zod.z.object({
  id: import_zod.z.string().default(() => crypto.randomUUID()),
  company: import_zod.z.string(),
  role: import_zod.z.string(),
  startDate: import_zod.z.string().nullable(),
  endDate: import_zod.z.string().nullable(),
  current: import_zod.z.boolean().default(false).optional(),
  vaultBullets: import_zod.z.array(vaultBulletSchema).default([])
});
var experienceEntrySchema = import_zod.z.object({
  company: import_zod.z.string(),
  role: import_zod.z.string(),
  startDate: import_zod.z.string().nullable(),
  endDate: import_zod.z.string().nullable(),
  vaultBullets: import_zod.z.array(vaultBulletSchema).default([]),
  bulletPoints: import_zod.z.array(import_zod.z.string()).optional()
}).transform((val) => ({
  ...val,
  vaultBullets: val.vaultBullets.length > 0 ? val.vaultBullets : (val.bulletPoints || []).map((b) => ({
    id: crypto.randomUUID(),
    text: b,
    keywords: [],
    isAIGenerated: true
  }))
}));
var projectSchema = import_zod.z.object({
  id: import_zod.z.string().default(() => crypto.randomUUID()),
  title: import_zod.z.string(),
  url: import_zod.z.string().nullable(),
  techStack: import_zod.z.array(import_zod.z.string()),
  vaultBullets: import_zod.z.array(vaultBulletSchema).default([])
});
var projectEntrySchema = import_zod.z.object({
  title: import_zod.z.string(),
  url: import_zod.z.string().nullable(),
  techStack: import_zod.z.array(import_zod.z.string()),
  vaultBullets: import_zod.z.array(vaultBulletSchema).default([]),
  bulletPoints: import_zod.z.array(import_zod.z.string()).optional()
}).transform((val) => ({
  ...val,
  vaultBullets: val.vaultBullets.length > 0 ? val.vaultBullets : (val.bulletPoints || []).map((b) => ({
    id: crypto.randomUUID(),
    text: b,
    keywords: [],
    isAIGenerated: true
  }))
}));
var profileSchema = import_zod.z.object({
  contact: contactSchema,
  education: import_zod.z.array(educationSchema),
  experience: import_zod.z.array(experienceSchema),
  projects: import_zod.z.array(projectSchema),
  skills: skillsSchema,
  certificates: import_zod.z.array(certificateSchema).default([]),
  githubUsername: import_zod.z.string().nullable().optional()
});
var legacyBulletsSchema = import_zod.z.object({
  vaultBullets: import_zod.z.array(vaultBulletSchema).default([]),
  bullets: import_zod.z.array(import_zod.z.string()).optional()
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
var summarySchema = import_zod.z.object({ summary: import_zod.z.string() });
var SECTION_SCHEMAS = {
  experience: bulletsSchema,
  projects: bulletsSchema,
  skills: skillsSchema,
  summary: summarySchema,
  experience_entry: experienceEntrySchema,
  project: projectEntrySchema
};
var parsedResumeSchema = import_zod.z.object({
  contact: contactSchema,
  education: import_zod.z.array(educationSchema),
  experience: import_zod.z.array(
    import_zod.z.object({
      company: import_zod.z.string(),
      role: import_zod.z.string(),
      startDate: import_zod.z.string().nullable(),
      endDate: import_zod.z.string().nullable(),
      vaultBullets: import_zod.z.array(vaultBulletSchema).default([]),
      bullets: import_zod.z.array(import_zod.z.string()).optional()
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
  projects: import_zod.z.array(
    import_zod.z.object({
      title: import_zod.z.string(),
      techStack: import_zod.z.array(import_zod.z.string()),
      vaultBullets: import_zod.z.array(vaultBulletSchema).default([]),
      bullets: import_zod.z.array(import_zod.z.string()).optional(),
      url: import_zod.z.string().nullable()
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
var tailorOutputSchema = import_zod.z.object({
  summary: import_zod.z.string().nullable(),
  experience: import_zod.z.array(
    import_zod.z.object({ company: import_zod.z.string(), role: import_zod.z.string(), startDate: import_zod.z.string().nullable(), endDate: import_zod.z.string().nullable(), vaultBullets: import_zod.z.array(vaultBulletSchema).default([]) })
  ),
  projects: import_zod.z.array(
    import_zod.z.object({ title: import_zod.z.string(), techStack: import_zod.z.array(import_zod.z.string()), vaultBullets: import_zod.z.array(vaultBulletSchema).default([]), url: import_zod.z.string().nullable() })
  ),
  skills: skillsSchema
});
var bulletSelectionSchema = import_zod.z.object({
  selections: import_zod.z.record(import_zod.z.string(), import_zod.z.array(import_zod.z.string())),
  rationale: import_zod.z.string()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
