# Render Deployment Guide

## Overview

The Express backend is deployed on Render as a **Docker-based web service**. The Docker image is built from `server/Dockerfile` and runs on port `8080`.

## Architecture

```
Frontend (Vercel)  ──rewrite──>  Backend (Render)
  resumint.vercel.app              resumint-backend-ihjf.onrender.com
                                        │
                                   PostgreSQL
```

All `/api/*` requests from the Next.js frontend are proxied to the Render backend via Vercel rewrites (see `vercel.json`).

## render.yaml

The infrastructure is defined in `render.yaml` at the project root:

```yaml
services:
  - type: web
    name: resumint-backend
    runtime: docker
    repo: https://github.com/DushyantBhardwaj2/resumeDatabase
    branch: main
    dockerfilePath: server/Dockerfile
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: BETTER_AUTH_SECRET
        sync: false
      - key: BETTER_AUTH_URL
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: OPENCODE_API_KEY
        sync: false
      - key: CORS_ORIGIN
        sync: false
    healthCheckPath: /api/health
```

All environment variables are marked `sync: false` — values must be set manually in the Render dashboard (they contain secrets).

## Dockerfile

The Dockerfile (`server/Dockerfile`) does the following:

1. **Base image:** `node:20-bullseye-slim`
2. **LaTeX installation:** Installs `texlive-latex-base`, `texlive-fonts-recommended`, `texlive-fonts-extra`, and `texlive-latex-extra` — required for server-side PDF compilation via `pdflatex`
3. **Shared dependencies:** Copies root `package.json`, `prisma/`, `prisma.config.ts`, and installs better-auth, Prisma, Zod, pdf-parse, etc.
4. **Shared source code:** Copies `src/core/`, `src/infrastructure/`, `src/config/`, `src/di/`
5. **Server code:** Copies `server/package.json`, `server/src/`, `server/tsconfig.json`; installs Express, cors, multer, tsx
6. **LaTeX template:** Copies `docs/` directory (contains `resume_template.tex`)
7. **Entrypoint:** `npm start` in `/app/server`

## Environment Variables

Set these in the Render dashboard under Environment:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret for Better Auth tokens (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Must point to the **Vercel frontend URL** (for OAuth callbacks) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OPENCODE_API_KEY` | API key for the AI provider |
| `CORS_ORIGIN` | Allowed CORS origin (the Vercel frontend URL) |
| `PORT` | Server port (Render sets this automatically) |

## Health Check

The server exposes `GET /api/health` which Returns `200 OK { status: "healthy" }`. Render polls this endpoint to verify the service is running.

## Deployment Flow

1. Push to `main` branch on GitHub
2. Render detects the push, pulls the repo, builds the Docker image, and deploys
3. On successful start, the health check is verified
4. The backend is available at `https://resumint-backend-ihjf.onrender.com`

## Troubleshooting

- **Build fails**: Check Docker build logs in Render dashboard. Common issues: missing `texlive` packages, npm install failures.
- **Runtime errors**: Check the Render runtime logs. The server crashes on startup if required env vars are missing or imports fail.
- **Health check failing**: Ensure the server starts without errors and listens on the correct `PORT`. Run `curl https://resumint-backend-ihjf.onrender.com/api/health` to test.
- **OAuth issues**: Verify `BETTER_AUTH_URL` points to the Vercel domain, not the Render domain. Google OAuth callbacks must go to the frontend.
- **LaTeX compilation errors**: Check the server logs when "Download PDF" is triggered. Missing `texlive` packages will cause `pdflatex` to fail.
