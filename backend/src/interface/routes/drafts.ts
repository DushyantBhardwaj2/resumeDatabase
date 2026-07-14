import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

const createDraftSchema = z.object({
  jobDescription: z.string().min(1),
  jdAnalysis: z.any(),
  selections: z.array(z.any()),
  templateId: z.string().default('ats-clean'),
})

const updateDraftSchema = z.object({
  selections: z.array(z.any()).optional(),
  templateId: z.string().optional(),
})

export function createDraftsRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/', zValidator('json', createDraftSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const body = c.req.valid('json')
      try {
        const draft = await container.draftUseCases.create(session.user.id, body)
        return c.json({ draft })
      } catch (err: any) {
        logger.error({ err, tag: 'draft-create' }, 'Draft creation error')
        return c.json({ error: err.message }, 500)
      }
    })
    .get('/', async (c) => {
      const session = c.get('session')
      const drafts = await container.draftUseCases.list(session.user.id)
      return c.json({ drafts })
    })
    .get('/:id', async (c) => {
      const id = c.req.param('id')
      const draft = await container.draftUseCases.get(id)
      if (!draft) return c.json({ error: 'Not found' }, 404)
      return c.json({ draft })
    })
    .patch('/:id', zValidator('json', updateDraftSchema), async (c) => {
      const id = c.req.param('id')
      const body = c.req.valid('json')
      const draft = await container.draftUseCases.update(id, body)
      return c.json({ draft })
    })
    .delete('/:id', async (c) => {
      const id = c.req.param('id')
      await container.draftUseCases.delete(id)
      return c.json({ success: true })
    })
    .post('/:id/duplicate', async (c) => {
      const session = c.get('session')
      const id = c.req.param('id')
      const draft = await container.draftUseCases.duplicate(id, session.user.id)
      return c.json({ draft })
    })
    .post('/:id/compile', async (c) => {
      const id = c.req.param('id')
      const draft = await container.draftUseCases.get(id)
      if (!draft) return c.json({ error: 'Not found' }, 404)
      return c.json({ jobId: `compile:${id}`, status: 'queued' })
    })
}

export const draftsRouter = createDraftsRouter(defaultContainer)
