import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './config/auth'
import { container } from './di/container'
import "dotenv/config"

const app = new Hono()

const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:3000'

app.use('*', cors({
  origin: frontendUrl,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  credentials: true,
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
  c.set('session', session)
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
  const profile = await container.profileUseCases.updateProfile(session.user.id, body)
  return c.json(profile)
})

// Tailor Resume API
app.post('/api/protected/resume/tailor', async (c) => {
  const session = c.get('session')
  const { url, description } = await c.req.json()
  try {
    const result = await container.resumeUseCases.tailorResume(session.user.id, url, description)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Resume Compilation API
app.post('/api/protected/resume/compile', async (c) => {
  const session = c.get('session')
  const { latexSource } = await c.req.json()
  // Ensure the compile API exists on the backend side or move the latex compiler
  // Actually, wait, the latex compile currently uses pdflatex. 
  // Let's implement it if it exists in di/container or just return a placeholder for now
  return c.json({ message: "Not implemented in backend yet" }, 501)
})

// History API
app.get('/api/history', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Unauthorized" }, 401)
  const history = await container.resumeUseCases.getHistory(session.user.id)
  return c.json(history)
})

app.get('/api/history/:id', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Unauthorized" }, 401)
  const id = c.req.param('id')
  const item = await container.resumeUseCases.getHistoryItem(session.user.id, id)
  if (!item) return c.json({ error: "Not found" }, 404)
  return c.json(item)
})

app.delete('/api/history/:id', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Unauthorized" }, 401)
  const id = c.req.param('id')
  await container.resumeUseCases.deleteHistoryItem(session.user.id, id)
  return c.json({ success: true })
})

app.put('/api/history/:id/styling', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Unauthorized" }, 401)
  const id = c.req.param('id')
  const styling = await c.req.json()
  await container.resumeUseCases.updateStyling(session.user.id, id, styling)
  return c.json({ success: true })
})

serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '8080')
}, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
})
