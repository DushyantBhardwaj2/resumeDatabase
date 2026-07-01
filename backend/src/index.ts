import "./env-init"
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './config/auth'
import { container } from './di/container'
import { filterExperienceBySelection, filterProjectsBySelection } from './core/application/services/bullet-filter'
import { computeCompleteness } from './infrastructure/profile-utils'
import { z } from 'zod'
import { addPdfJob, pdfQueue } from './infrastructure/queue/pdf-queue'
import { redisClient } from './infrastructure/queue/redis'
import { rateLimiter } from './infrastructure/rate-limiter'
// Importing this module starts the in-process BullMQ PDF worker as a side-effect
import './infrastructure/queue/pdf-worker'

type Variables = {
  session: { user: { id: string; email: string; name: string; image?: string }; session: { id: string; expiresAt: Date; ipAddress?: string; userAgent?: string } }
}

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

app.use('/api/protected/ai/*', aiRateLimiter)
app.use('/api/protected/resume/tailor', aiRateLimiter)
app.use('/api/protected/resume/parse', aiRateLimiter)
app.use('/api/protected/chat/*', aiRateLimiter)

app.use('/api/protected/resume/compile-live', compileRateLimiter)

app.use('/api/protected/profile', generalRateLimiter)
app.use('/api/protected/history/*', generalRateLimiter)


// Profile API
app.get('/api/protected/profile', async (c) => {
  const session = c.get('session')
  const profile = await container.profileUseCases.getProfile(session.user.id)
  if (!profile) return c.json(null)
  return c.json({ ...profile, completeness: computeCompleteness(profile) })
})

app.post('/api/protected/profile', async (c) => {
  const session = c.get('session')
  const body = await c.req.json()
  const { rawText, parsed: data } = body
  const profile = await container.profileUseCases.saveFromOnboarding(
    session.user.id, rawText || "", data || {},
    { name: session.user.name, email: session.user.email }
  )
  return c.json(profile)
})

app.patch('/api/protected/profile', async (c) => {
  const session = c.get('session')
  const body = await c.req.json()
  try {
    const profile = await container.profileUseCases.updateProfile(session.user.id, body)
    return c.json(profile)
  } catch (err: any) {
    console.error("Profile update error:", err)
    return c.json({ error: err.message }, 500)
  }
})

// AI Generate Bullets API
app.post('/api/protected/ai/generate-bullets', async (c) => {
  const session = c.get('session')
  const { section, rawInput, context } = await c.req.json()
  
  if (!section || !rawInput) {
    return c.json({ error: "Missing required fields" }, 400)
  }

  try {
    const result = await container.aiUseCases.generate(section, rawInput, context)
    return c.json(result)
  } catch (err: any) {
    console.error("AI generation error:", err)
    return c.json({ error: err.message }, 500)
  }
})

// Tailor Resume API
app.post('/api/protected/resume/tailor', async (c) => {
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

// Resume Parse API
app.post('/api/protected/resume/parse', async (c) => {
  try {
    const session = c.get('session')

    // Check if user already has a profile — return existing data if so
    const existing = await container.profileUseCases.getProfile(session.user.id)
    if (existing) {
      return c.json({ rawText: "", parsed: existing, fromDb: true })
    }

    const body = await c.req.parseBody()
    const file = body['file']
    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400)
    }
    if (!file.name.endsWith('.pdf')) {
      return c.json({ error: "Only PDF files are accepted" }, 400)
    }
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "File size exceeds 5MB limit" }, 400)
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await container.resumeUseCases.parseResume(buffer)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Resume Compilation API
app.post('/api/protected/resume/compile', async (c) => {
  const session = c.get('session')
  const { latexSource } = await c.req.json()
  return c.json({ message: "Not implemented in backend yet" }, 501)
})

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
  profile: z.object({
    contact: z.record(z.string(), z.string().max(1000).nullable()).optional().nullable(),
    education: z.array(z.record(z.string(), z.unknown())).max(10).optional().nullable(),
    experience: z.array(z.object({
      id: z.string().max(100).optional(),
      company: z.string().max(500),
      role: z.string().max(500),
      startDate: z.string().max(100).nullable().optional(),
      endDate: z.string().max(100).nullable().optional(),
      current: z.boolean().optional(),
      vaultBullets: z.array(vaultBulletSchema).max(200).optional().default([]),
    }).passthrough()).max(20).optional().nullable(),
    projects: z.array(z.object({
      id: z.string().max(100).optional(),
      title: z.string().max(500),
      url: z.string().max(2000).nullable().optional(),
      techStack: z.array(z.string().max(200)).max(50).optional().default([]),
      vaultBullets: z.array(vaultBulletSchema).max(200).optional().default([]),
    }).passthrough()).max(20).optional().nullable(),
    skills: z.object({
      languages: z.array(z.string().max(200)).max(100).optional().default([]),
      frameworks: z.array(z.string().max(200)).max(100).optional().default([]),
      tools: z.array(z.string().max(200)).max(100).optional().default([]),
    }).optional().nullable(),
  }).passthrough(),
})

// ── Async PDF Compilation — enqueue job, poll status, fetch result ────────────

// POST /compile-live — validates input, fills LaTeX template (fast, sync),
// enqueues a BullMQ job, and returns { jobId } immediately (< 5 ms).
// pdflatex runs in the worker via execFileAsync — the event loop is never blocked.
app.post('/api/protected/resume/compile-live', async (c) => {
  const rawBody = await c.req.json()
  const parsed = compileLiveSchema.safeParse(rawBody)

  if (!parsed.success) {
    const errors = parsed.error.flatten()
    return c.json({ error: 'Validation failed', details: errors.fieldErrors }, 400)
  }

  const { profile, selectedBulletIds, templateId: safeTemplateId } = parsed.data

  const filteredExperience = filterExperienceBySelection(profile.experience || [], selectedBulletIds)
  const filteredProjects = filterProjectsBySelection(profile.projects || [], selectedBulletIds)

  // Template filling is pure string manipulation — fast and synchronous
  const latexSource = container.latexTemplate.fill(
    safeTemplateId,
    profile.contact || null,
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

// GET /compile-status/:jobId — lightweight poll endpoint.
// Returns: { status: 'queued' | 'active' | 'completed' | 'failed', error?: string }
app.get('/api/protected/resume/compile-status/:jobId', async (c) => {
  const jobId = c.req.param('jobId')
  try {
    const job = await pdfQueue.getJob(jobId)
    if (!job) return c.json({ status: 'not_found' }, 404)

    const state = await job.getState()
    // BullMQ states: waiting | active | completed | failed | delayed | paused
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

// GET /compile-result/:jobId — fetch the compiled PDF bytes from Redis.
// Result is available for 5 minutes after the job completes (Redis TTL).
app.get('/api/protected/resume/compile-result/:jobId', async (c) => {
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

// ── Chat API (Phase 2+) ───────────────────────────────────────────────────────

app.post('/api/protected/chat/interact', async (c) => {
  const body = await c.req.json()
  try {
    const result = await container.chatUseCases.parseIntent(body)
    return c.json(result)
  } catch (err: any) {
    console.error("Chat intent error:", err)
    return c.json({ error: err.message }, 500)
  }
})

app.post('/api/protected/ai/expand-vault', async (c) => {
  const body = await c.req.json()
  try {
    const result = await container.chatUseCases.expandVault(body)
    return c.json(result)
  } catch (err: any) {
    console.error("Vault expansion error:", err)
    return c.json({ error: err.message }, 500)
  }
})

app.post('/api/protected/ai/select-bullets', async (c) => {
  const session = c.get('session')
  const { jobDescription } = await c.req.json()
  try {
    const profile = await container.profileUseCases.getProfile(session.user.id)
    if (!profile) return c.json({ error: "Profile not found" }, 404)
    const result = await container.chatUseCases.selectBullets({ jobDescription, profile })
    return c.json(result)
  } catch (err: any) {
    console.error("Bullet selection error:", err)
    return c.json({ error: err.message }, 500)
  }
})

// History API (protected)
app.get('/api/protected/history', async (c) => {
  const session = c.get('session')
  const history = await container.historyUseCases.list(session.user.id)
  return c.json(history)
})

app.get('/api/protected/history/:id', async (c) => {
  const session = c.get('session')
  const id = c.req.param('id')
  const item = await container.historyUseCases.get(id, session.user.id)
  if (!item) return c.json({ error: "Not found" }, 404)
  return c.json(item)
})

app.delete('/api/protected/history/:id', async (c) => {
  const session = c.get('session')
  const id = c.req.param('id')
  await container.historyUseCases.delete(id, session.user.id)
  return c.json({ success: true })
})

app.put('/api/protected/history/:id/styling', async (c) => {
  const session = c.get('session')
  const id = c.req.param('id')
  const styling = await c.req.json()
  await container.historyUseCases.updateStyling(id, session.user.id, styling)
  return c.json({ success: true })
})

serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '8080')
}, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
  console.log('[PDF Worker] in-process worker active (concurrency=2)')
})
