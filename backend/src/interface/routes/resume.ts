import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { container as defaultContainer } from '../../di/container'
import { filterExperienceBySelection, filterProjectsBySelection } from '../../core/application/services/bullet-filter'
import { addPdfJob, pdfQueue } from '../../infrastructure/queue/pdf-queue'
import { redisClient } from '../../infrastructure/queue/redis'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

const vaultBulletSchema = z.object({
  id: z.string().max(100),
  text: z.string().max(5000),
  category: z.enum(['FRONTEND', 'BACKEND', 'DEVOPS', 'LEADERSHIP', 'GENERAL']).optional(),
  keywords: z.array(z.string().max(100)).max(50).default([]),
  isAIGenerated: z.boolean().default(false),
})

const compileLiveSchema = z.object({
  templateId: z.enum(['nsut-canonical', 'ats-clean', 'modern', 'compact']),
  selectedBulletIds: z.record(z.string().max(100), z.array(z.string().max(100)).max(200)).optional().default({}),
  selectedExperienceIds: z.array(z.string().max(100)).max(50).optional(),
  selectedProjectIds: z.array(z.string().max(100)).max(50).optional(),
  contactSelection: z.object({
    name: z.string().max(1000).optional(),
    email: z.union([z.string().max(500), z.array(z.string().max(500))]).optional(),
    phone: z.union([z.string().max(100), z.array(z.string().max(100))]).optional(),
    linkedin: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
    github: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
    portfolio: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
    leetcode: z.union([z.string().max(1000), z.array(z.string().max(1000))]).optional(),
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
  }),
})

export function createResumeRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/tailor', async (c) => {
      const session = c.get('session')
      const body = await c.req.json()
      const { title, company, description, templateId } = body
      const startTime = Date.now()
      try {
        console.log(`[TAILOR] start userId=${session.user.id} title="${title || body.jobTitle}" company="${company || body.company}"`)
        const result = await container.resumeUseCases.tailorResume(
          session.user.id,
          {
            jobTitle: title || body.jobTitle,
            company: company || body.company,
            jobDescription: description || body.jobDescription,
          },
          templateId || 'nsut-canonical'
        )
        const elapsed = Date.now() - startTime
        console.log(`[TAILOR] success userId=${session.user.id} elapsed=${elapsed}ms`)
        return c.json(result)
      } catch (err: any) {
        const elapsed = Date.now() - startTime
        console.error(`[TAILOR] error userId=${session.user.id} elapsed=${elapsed}ms error=${err.message}`)
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/parse', async (c) => {
      try {
        const session = c.get('session')

        const existing = await container.profileUseCases.getProfile(session.user.id)
        if (existing) {
          return c.json({ rawText: '', parsed: existing, fromDb: true })
        }

        const body = await c.req.parseBody()
        const file = body['file']
        if (!file || !(file instanceof File)) {
          return c.json({ error: 'No file uploaded' }, 400)
        }
        if (!file.name.endsWith('.pdf')) {
          return c.json({ error: 'Only PDF files are accepted' }, 400)
        }
        if (file.size > 5 * 1024 * 1024) {
          return c.json({ error: 'File size exceeds 5MB limit' }, 400)
        }
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await container.resumeUseCases.parseResume(buffer)
        return c.json(result)
      } catch (err: any) {
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/compile', async (c) => {
      return c.json({ message: 'Not implemented in backend yet' }, 501)
    })
    .post('/compile-live', zValidator('json', compileLiveSchema), async (c) => {
      const { profile, selectedBulletIds, selectedExperienceIds, selectedProjectIds, contactSelection, templateId: safeTemplateId } = c.req.valid('json')

      let experienceToKeep = profile.experience || []
      if (selectedExperienceIds) {
        experienceToKeep = experienceToKeep.filter((e) => selectedExperienceIds.includes(e.id || ''))
      }

      let projectsToKeep = profile.projects || []
      if (selectedProjectIds) {
        projectsToKeep = projectsToKeep.filter((p) => selectedProjectIds.includes(p.id || ''))
      }

      const filteredExperience = filterExperienceBySelection(experienceToKeep, selectedBulletIds)
      const filteredProjects = filterProjectsBySelection(projectsToKeep, selectedBulletIds)

      const effectiveContact = {
        ...(profile.contact || {}),
        ...(contactSelection || {})
      }

      const latexSource = container.latexTemplate.fill(
        safeTemplateId,
        effectiveContact,
        profile.education || null,
        filteredExperience,
        filteredProjects,
        profile.skills || null,
        {
          experience: filteredExperience,
          projects: filteredProjects,
          skills: profile.skills || { languages: [], frameworks: [], tools: [] },
        }
      )

      try {
        const jobId = await addPdfJob({ latexSource, templateId: safeTemplateId })
        return c.json({ jobId })
      } catch (err: any) {
        console.error('[compile-live] Failed to enqueue job:', err.message)
        return c.json({ error: 'Failed to queue PDF compilation', details: err.message }, 500)
      }
    })
    .get('/compile-status/:jobId', async (c) => {
      const jobId = c.req.param('jobId')
      try {
        const job = await pdfQueue.getJob(jobId)
        if (!job) return c.json({ status: 'not_found' }, 404)

        const state = await job.getState()
        const status = state === 'active' ? 'active'
          : state === 'completed' ? 'completed'
          : state === 'failed' ? 'failed'
          : 'queued'

        const error = state === 'failed' ? (job.failedReason ?? 'Compilation failed') : undefined
        return c.json({ status, error })
      } catch (err: any) {
        return c.json({ error: err.message }, 500)
      }
    })
    .get('/compile-result/:jobId', async (c) => {
      const jobId = c.req.param('jobId')
      try {
        const encoded = await redisClient.get(`pdf:result:${jobId}`)
        if (!encoded) {
          return c.json({ error: 'Result not found or expired (TTL: 5 min). Re-compile to refresh.' }, 404)
        }
        const pdfBuffer = Buffer.from(encoded, 'base64')
        return c.newResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="resume.pdf"`,
          },
        })
      } catch (err: any) {
        return c.json({ error: err.message }, 500)
      }
    })
}

export const resumeRouter = createResumeRouter(defaultContainer)
