import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createHistoryRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .get('/', async (c) => {
      const session = c.get('session')
      const history = await container.historyUseCases.list(session.user.id)
      return c.json(history)
    })
    .get('/:id', async (c) => {
      const session = c.get('session')
      const id = c.req.param('id')
      const item = await container.historyUseCases.get(id)
      if (!item) return c.json({ error: 'Not found' }, 404)
      return c.json(item)
    })
    .delete('/:id', async (c) => {
      const session = c.get('session')
      const id = c.req.param('id')
      await container.historyUseCases.delete(id)
      return c.json({ success: true })
    })
}

export const historyRouter = createHistoryRouter(defaultContainer)
