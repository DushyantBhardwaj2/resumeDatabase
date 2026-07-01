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

// Importing this module starts the in-process BullMQ PDF worker as a side-effect
import './infrastructure/queue/pdf-worker'

const app = new Hono<{ Variables: Variables }>()

const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:3000'

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return frontendUrl;
    if (origin.endsWith('.vercel.app') || origin.includes('localhost')) {
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
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw)
})

// Middleware to protect routes and inject session
app.use('/api/protected/*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
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
app.use('/api/protected/resume/tailor', aiRateLimiter)
app.use('/api/protected/resume/parse', aiRateLimiter)
app.use('/api/protected/chat/*', aiRateLimiter)

app.use('/api/protected/resume/compile-live', compileRateLimiter)

app.use('/api/protected/profile/*', generalRateLimiter)
app.use('/api/protected/profile', generalRateLimiter)
app.use('/api/protected/history/*', generalRateLimiter)
app.use('/api/protected/history', generalRateLimiter)

// ── Mount Sub-Routers ─────────────────────────────────────────────────────────

app.route('/api/protected/profile', profileRouter)
app.route('/api/protected/resume', resumeRouter)
app.route('/api/protected/ai', aiRouter)
app.route('/api/protected/chat', chatRouter)
app.route('/api/protected/history', historyRouter)

// ── Server Start ──────────────────────────────────────────────────────────────

serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '8080')
}, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
  console.log('[PDF Worker] in-process worker active (concurrency=2)')
})
