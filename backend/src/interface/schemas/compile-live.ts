import { z } from 'zod'

export const vaultBulletSchema = z.object({
  id: z.string().max(100),
  text: z.string().max(5000),
  category: z.enum(['FRONTEND', 'BACKEND', 'DEVOPS', 'LEADERSHIP', 'GENERAL']).optional(),
  keywords: z.array(z.string().max(100)).max(50).default([]),
  isAIGenerated: z.boolean().default(false),
})

export const compileLiveSchema = z.object({
  templateId: z.enum(['nsut-canonical', 'ats-clean', 'modern', 'compact']),
  selectedBulletIds: z.record(z.string().max(100), z.array(z.string().max(100)).max(200)).optional().default({}),
  selectedExperienceIds: z.array(z.string().max(100)).max(50).optional(),
  selectedProjectIds: z.array(z.string().max(100)).max(50).optional(),
  selectedEducationIds: z.array(z.string().max(200)).max(20).optional(),
  contactSelection: z.object({
    name: z.string().max(1000).optional(),
    email: z.union([z.string().max(500), z.array(z.string().max(500))]).optional(),
    phone: z.union([z.string().max(100), z.array(z.string().max(100))]).optional(),
    linkedin: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
    github: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
    portfolio: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
    leetcode: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
    enabledSocials: z.array(z.string().max(50)).max(10).optional(),
  }).optional(),
  profile: z.object({
    contact: z.record(z.string(), z.union([z.string(), z.array(z.string())]).nullable()).optional().nullable(),
    education: z.array(z.record(z.string(), z.unknown())).max(10).optional().nullable(),
    experience: z.array(z.object({
      id: z.string().max(100).optional(),
      company: z.string().max(500),
      role: z.string().max(500),
      startDate: z.string().max(100).nullable().optional(),
      endDate: z.string().max(100).nullable().optional(),
      current: z.boolean().optional(),
      vaultBullets: z.array(vaultBulletSchema).max(200).optional().default([]),
    })).max(20).optional().nullable(),
    projects: z.array(z.object({
      id: z.string().max(100).optional(),
      title: z.string().max(500),
      url: z.string().max(2000).nullable().optional(),
      techStack: z.array(z.string().max(200)).max(50).optional().default([]),
      vaultBullets: z.array(vaultBulletSchema).max(200).optional().default([]),
    })).max(20).optional().nullable(),
    skills: z.object({
      languages: z.array(z.string().max(200)).max(100).optional().default([]),
      frameworks: z.array(z.string().max(200)).max(100).optional().default([]),
      tools: z.array(z.string().max(200)).max(100).optional().default([]),
    }).optional().nullable(),
    extracurriculars: z.array(z.object({
      id: z.string().max(100).default(() => crypto.randomUUID()),
      title: z.string().max(500),
      description: z.string().max(5000),
      date: z.string().max(100).nullable().optional(),
    })).max(20).optional().nullable(),
  }),
})
