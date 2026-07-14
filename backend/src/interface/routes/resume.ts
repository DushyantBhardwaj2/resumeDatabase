import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import { compileLiveSchema } from '../schemas/compile-live'
import { filterExperienceBySelection, filterProjectsBySelection } from '../../core/application/services/bullet-filter'
import { addPdfJob, pdfQueue } from '../../infrastructure/queue/pdf-queue'
import { redisClient } from '../../infrastructure/queue/redis'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createResumeRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/compile-live', zValidator('json', compileLiveSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { profile, selectedBulletIds, selectedExperienceIds, selectedProjectIds, selectedEducationIds, contactSelection, templateId: safeTemplateId } = c.req.valid('json')

      let experienceToKeep = profile.experience || []
      if (selectedExperienceIds) {
        experienceToKeep = experienceToKeep.filter((e) => selectedExperienceIds.includes(e.id || ''))
      }

      let projectsToKeep = profile.projects || []
      if (selectedProjectIds) {
        projectsToKeep = projectsToKeep.filter((p) => selectedProjectIds.includes(p.id || ''))
      }

      const filteredExperience = filterExperienceBySelection(experienceToKeep, selectedBulletIds)
        .filter((e) => e.vaultBullets && e.vaultBullets.length > 0)
      const filteredProjects = filterProjectsBySelection(projectsToKeep, selectedBulletIds)
        .filter((p) => p.vaultBullets && p.vaultBullets.length > 0)

      let educationToKeep = profile.education || []
      if (selectedEducationIds) {
        educationToKeep = educationToKeep.filter((e) =>
          selectedEducationIds.includes(((e as Record<string, unknown>).id as string) || '')
        )
      }

      const effectiveContact = {
        ...(profile.contact || {}),
        ...(contactSelection || {})
      }

      const latexSource = container.latexTemplate.fill(
        safeTemplateId,
        effectiveContact,
        educationToKeep,
        filteredExperience,
        filteredProjects,
        profile.skills || null,
        {
          experience: filteredExperience,
          projects: filteredProjects,
          skills: profile.skills || { languages: [], frameworks: [], tools: [] },
        },
        profile.extracurriculars || []
      )

      try {
        const jobId = await addPdfJob({ latexSource, templateId: safeTemplateId })
        return c.json({ jobId })
      } catch (err: any) {
        logger.error({ err: err.message, tag: 'compile-live' }, 'Failed to enqueue job')
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
            'Content-Disposition': 'inline; filename="resume.pdf"',
          },
        })
      } catch (err: any) {
        return c.json({ error: err.message }, 500)
      }
    })
}

export const resumeRouter = createResumeRouter(defaultContainer)
