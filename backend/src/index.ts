import "./env-init"
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './config/auth'
import { rateLimiter } from './infrastructure/rate-limiter'
import type { Variables } from './interface/types'

// Sub-routers
import { profileRouter } from './interface/routes/profile'
import { resumeRouter } from './interface/routes/resume'
import { aiRouter } from './interface/routes/ai'
import { chatRouter } from './interface/routes/chat'
import { historyRouter } from './interface/routes/history'
import { memoryRouter } from './interface/routes/memory'
import { draftsRouter } from './interface/routes/drafts'
import { githubRouter } from './interface/routes/github'
import { parseRouter } from './interface/routes/parse'
import { kbRouter } from './interface/routes/kb'

import { logger } from './infrastructure/logger'
import { startPdfWorker, stopPdfWorker } from './infrastructure/queue/pdf-worker'

const app = new Hono<{ Variables: Variables }>()

const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:3000'

const allowedOrigins = [
  frontendUrl,
  'http://localhost:3000',
  'http://localhost:8080',
]

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return frontendUrl;
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return origin;
    }
    return frontendUrl;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}))

// Health check (no auth required)
app.get('/api/health', (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Auth rate limit (20 req/min per IP)
app.use('/api/auth/*', rateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: (c) => `auth:${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'}`,
  message: 'Too many authentication attempts. Please try again in a minute.'
}))

// BetterAuth handler
app.all('/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

// Middleware to protect routes and inject session
app.use('/api/protected/*', async (c, next) => {
  const cookie = c.req.header('cookie') || ''

  // Pass cookie as a plain record so BetterAuth's internal context
  // always finds the header. The Headers() copy path can lose cookies
  // when Hono wraps the native request.
  let session = await auth.api.getSession({ headers: { cookie } })

  if (!session) {
    session = await auth.api.getSession({ headers: c.req.raw.headers })
  }

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  c.set('session', session as unknown as Variables['session'])
  await next()
})

// ── Protected Rate Limiters ───────────────────────────────────────────────────

const aiRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  keyGenerator: (c) => `ai:${c.get('session')?.user?.id || 'unknown'}`,
  message: 'AI usage limit reached (10 requests per hour). Please try again later.'
})

const compileRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 min
  limit: 15,
  keyGenerator: (c) => `compile:${c.get('session')?.user?.id || 'unknown'}`,
  message: 'Compilation rate limit exceeded. Please wait a moment before trying again.'
})

const generalRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 min
  limit: 100,
  keyGenerator: (c) => `general:${c.get('session')?.user?.id || 'unknown'}`,
  message: 'API rate limit exceeded. Please wait a moment.'
})

// Apply rate limiters
app.use('/api/protected/ai/*', aiRateLimiter)
app.use('/api/protected/chat/*', aiRateLimiter)
app.use('/api/protected/parse', aiRateLimiter)
app.use('/api/protected/github/analyze', aiRateLimiter)

app.use('/api/protected/resume/compile-live', compileRateLimiter)

app.use('/api/protected/profile/*', generalRateLimiter)
app.use('/api/protected/profile', generalRateLimiter)
app.use('/api/protected/history/*', generalRateLimiter)
app.use('/api/protected/history', generalRateLimiter)
app.use('/api/protected/memory/*', generalRateLimiter)
app.use('/api/protected/drafts/*', generalRateLimiter)
app.use('/api/protected/drafts', generalRateLimiter)
app.use('/api/protected/github/import', generalRateLimiter)
app.use('/api/protected/kb/*', generalRateLimiter)

// ── Mount Sub-Routers ─────────────────────────────────────────────────────────

const routes = app
  .route('/api/protected/profile', profileRouter)
  .route('/api/protected/resume', resumeRouter)
  .route('/api/protected/ai', aiRouter)
  .route('/api/protected/chat', chatRouter)
  .route('/api/protected/history', historyRouter)
  .route('/api/protected/memory', memoryRouter)
  .route('/api/protected/drafts', draftsRouter)
  .route('/api/protected/github', githubRouter)
  .route('/api/protected/parse', parseRouter)
  .route('/api/protected/kb', kbRouter)

export type AppType = typeof routes

// ── Server Start ──────────────────────────────────────────────────────────────

const server = serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '8080')
}, (info) => {
  logger.info({ port: info.port }, 'listening')
  startPdfWorker()
})

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'received signal, shutting down gracefully')
  await stopPdfWorker()
  server.close()
  logger.info({ tag: 'Server' }, 'goodbye')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
