import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'
import type { MemoryType } from '../../shared'

const memoryTypeSchema = z.enum(["experience", "project", "education", "skill", "certificate", "achievement"])

export function createMemoryRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .get('/', async (c) => {
      const session = c.get('session')
      const search = c.req.query('search')
      const type = c.req.query('type') as MemoryType | undefined
      try {
        const results = await container.memoryUseCases.search(session.user.id, search)
        let entries = results
        if (type) entries = results.filter((e) => e.type === type)
        return c.json({ entries, total: entries.length })
      } catch (err: any) {
        logger.error({ err, tag: 'memory-search' }, 'Memory search error')
        return c.json({ error: err.message }, 500)
      }
    })
    .get('/:type/:id', async (c) => {
      const session = c.get('session')
      const type = memoryTypeSchema.parse(c.req.param('type'))
      const id = c.req.param('id')
      const entry = await container.memoryUseCases.getEntry(type, id)
      if (!entry) return c.json({ error: 'Not found' }, 404)
      return c.json({ entry })
    })
    .patch('/:type/:id', zValidator('json', z.object({ changes: z.record(z.string(), z.unknown()) })), async (c) => {
      const session = c.get('session')
      const type = memoryTypeSchema.parse(c.req.param('type'))
      const id = c.req.param('id')
      const { changes } = c.req.valid('json')
      const entry = await container.memoryUseCases.updateEntry(type, id, changes)
      return c.json({ entry })
    })
    .delete('/:type/:id', async (c) => {
      const session = c.get('session')
      const type = memoryTypeSchema.parse(c.req.param('type'))
      const id = c.req.param('id')
      await container.memoryUseCases.deleteEntry(type, id)
      return c.json({ success: true })
    })
    .get('/count', async (c) => {
      const session = c.get('session')
      const results = await container.memoryUseCases.search(session.user.id)
      const byType: Record<string, number> = {}
      for (const e of results) {
        byType[e.type] = (byType[e.type] || 0) + 1
      }
      return c.json({ total: results.length, byType })
    })
    .get('/export', async (c) => {
      const session = c.get('session')
      const results = await container.memoryUseCases.search(session.user.id)
      return c.json({ entries: results })
    })
}

export const memoryRouter = createMemoryRouter(defaultContainer)
