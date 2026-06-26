import "./env-init"
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './config/auth'
import { container } from './di/container'
import { filterExperienceBySelection, filterProjectsBySelection } from './core/application/services/bullet-filter'

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

// Profile API
app.get('/api/protected/profile', async (c) => {
  const session = c.get('session')
  const profile = await container.profileUseCases.getProfile(session.user.id)
  return c.json(profile || null)
})

app.post('/api/protected/profile', async (c) => {
  const session = c.get('session')
  const body = await c.req.json()
  const { rawText, parsed: data } = body
  const profile = await container.profileUseCases.saveFromOnboarding(session.user.id, rawText || "", data || {})
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

// Live Compile (debounced, filtered by selected bullets)
app.post('/api/protected/resume/compile-live', async (c) => {
  const { profile, selectedBulletIds, templateId } = await c.req.json()

  if (!profile) {
    return c.json({ error: "Profile is required" }, 400)
  }

  const filteredExperience = filterExperienceBySelection(profile.experience, selectedBulletIds)
  const filteredProjects = filterProjectsBySelection(profile.projects, selectedBulletIds)

  const latexSource = container.latexTemplate.fill(
    templateId || 'nsut-canonical',
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
    const { execSync } = require('child_process')
    const { writeFileSync, unlinkSync, mkdtempSync, copyFileSync, existsSync } = require('fs')
    const { join } = require('path')
    const { tmpdir } = require('os')
    const { randomUUID } = require('crypto')

    const jobId = randomUUID()
    const tempDir = mkdtempSync(join(tmpdir(), 'latex-'))
    const texPath = join(tempDir, `${jobId}.tex`)
    const pdfPath = join(tempDir, `${jobId}.pdf`)

    // Copy NSUT_logo.png from template directory into temp compile dir
    const templatesDir = join(__dirname, 'infrastructure', 'latex', 'templates')
    const logoPath = join(templatesDir, templateId || 'nsut-canonical', 'NSUT_logo.png')
    if (existsSync(logoPath)) {
      copyFileSync(logoPath, join(tempDir, 'NSUT_logo.png'))
    }

    writeFileSync(texPath, latexSource, 'utf-8')
    execSync(`pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"`, {
      timeout: 30000,
      stdio: 'pipe',
    })

    const pdfBuffer = require('fs').readFileSync(pdfPath)

    try {
      const { readdirSync, rmSync } = require('fs')
      for (const f of readdirSync(tempDir)) {
        unlinkSync(join(tempDir, f))
      }
      rmSync(tempDir, { recursive: true })
    } catch { /* best-effort cleanup */ }

    return c.newResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="resume.pdf"`,
      },
    })
  } catch (err: any) {
    const details = err.message || String(err)
    console.error('PDF compilation error:', details)
    if (err.stderr) console.error('STDERR:', err.stderr.toString())
    return c.json({ error: 'PDF compilation failed. Check your LaTeX template.', details }, 500)
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
})
