import { Hono } from 'hono'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createKbRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .get('/version', async (c) => {
      const info = container.kbUseCases.getVersionInfo()
      return c.json(info)
    })
}

export const kbRouter = createKbRouter(defaultContainer)
