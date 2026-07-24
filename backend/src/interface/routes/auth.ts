import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import bcrypt from 'bcryptjs'
import { prisma } from '../../config/prisma'
import type { Variables } from '../types'

export const authRouter = new Hono<{ Variables: Variables }>()

authRouter.get('/password-status', async (c) => {
  const session = c.get('session')
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const emailAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: 'email' },
    select: { password: true },
  })

  return c.json({ hasPassword: !!emailAccount?.password })
})

const setPasswordSchema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
})

authRouter.post('/set-password', zValidator('json', setPasswordSchema), async (c) => {
  const session = c.get('session')
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const { name, password } = c.req.valid('json')

  const existing = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: 'email' },
  })

  const hashed = await bcrypt.hash(password, 10)

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: hashed },
    })
  } else {
    await prisma.account.create({
      data: {
        userId: session.user.id,
        providerId: 'email',
        accountId: session.user.id,
        password: hashed,
      },
    })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  })

  return c.json({ success: true })
})
