import express from "express"
import cors from "cors"
import { toNodeHandler } from "better-auth/node"
import { auth } from "../../src/config/auth"

import profileRouter from "./routes/profile"
import profileSaveRouter from "./routes/profile-save"
import historyRouter from "./routes/history"
import resumeRouter from "./routes/resume"
import aiRouter from "./routes/ai"
import githubRouter from "./routes/github"
import compileRouter from "./routes/compile"

const app = express()
const PORT = parseInt(process.env.PORT || "8080", 10)

// CORS — allow Vercel frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}))

app.set("trust proxy", 1)
app.use(express.json({ limit: "10mb" }))

// Better Auth handler — mounted at /api/auth/*
app.all("/api/auth/*", toNodeHandler(auth.handler))

// API routes
app.use("/api/profile", profileRouter)
app.use("/api/profile/save", profileSaveRouter)
app.use("/api/history", historyRouter)
app.use("/api/resume", resumeRouter)
app.use("/api/ai", aiRouter)
app.use("/api", githubRouter)
app.use("/api/compile", compileRouter)

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Resumint backend listening on port ${PORT}`)
})
