import { Hono } from 'hono'
import { container } from '../../di/container'
import type { Variables } from '../types'

export const historyRouter = new Hono<{ Variables: Variables }>()
  .get('/', async (c) => {
    const session = c.get('session')
    const history = await container.historyUseCases.list(session.user.id)
    return c.json(history)
  })
  .get('/:id', async (c) => {
    const session = c.get('session')
    const id = c.req.param('id')
    const item = await container.historyUseCases.get(id, session.user.id)
    if (!item) return c.json({ error: "Not found" }, 404)
    return c.json(item)
  })
  .delete('/:id', async (c) => {
    const session = c.get('session')
    const id = c.req.param('id')
    await container.historyUseCases.delete(id, session.user.id)
    return c.json({ success: true })
  })
  .patch('/:id', async (c) => {
    const session = c.get('session')
    const id = c.req.param('id')
    const body = await c.req.json()
    // Implementation for saving tailored changes manually 
    await container.historyUseCases.updateStyling(id, session.user.id, body)
    return c.json({ success: true })
  })
  .put('/:id/styling', async (c) => {
    const session = c.get('session')
    const id = c.req.param('id')
    const styling = await c.req.json()
    await container.historyUseCases.updateStyling(id, session.user.id, styling)
    return c.json({ success: true })
  })
