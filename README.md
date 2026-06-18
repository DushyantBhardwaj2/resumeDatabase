# Resumint

AI-powered resume tailoring platform for NSUT students.

## Architecture

This project follows **Clean Architecture** principles with a strict three-layer separation:

```
┌─────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                   │
│  Vercel (Next.js)          Render (Express Server)  │
│  ┌─────────────────┐       ┌──────────────────────┐ │
│  │ pages            │       │ routes/              │ │
│  │ components       │       │ middleware/auth.ts   │ │
│  │ auth-client.ts   │       │ server/src/index.ts  │ │
│  └──────┬──────────┘       └──────┬───────────────┘ │
│         │                         │                  │
├─────────┼─────────────────────────┼──────────────────┤
│         │   APPLICATION LAYER     │                  │
│         │  use-cases/             │                  │
│         │    ├─ profile           │                  │
│         │    ├─ resume            │                  │
│         │    ├─ ai                │                  │
│         │    ├─ history           │                  │
│         │    └─ github            │                  │
│         │  dto/                   │                  │
│         │  ports/                 │                  │
├─────────┼─────────────────────────┼──────────────────┤
│         │    DOMAIN LAYER         │                  │
│         │  entities.ts            │                  │
│         │  repositories.ts        │                  │
├─────────┼─────────────────────────┼──────────────────┤
│         │  INFRASTRUCTURE LAYER   │                  │
│         │  ai/ (OpenCode Zen API) │                  │
│         │  pdf/ (pdf-parse)       │                  │
│         │  latex/ (LaTeX gen)     │                  │
│         │  persistence/ (Prisma)  │                  │
│         │  validation/ (Zod)      │                  │
│         │  prompts/ (AI prompts)  │                  │
│         │  di/container.ts        │                  │
└─────────┴─────────────────────────┴──────────────────┘
```

### Layer Rules

- **Domain Layer** — Pure TypeScript types and interfaces. Zero external dependencies.
- **Application Layer** — Use cases orchestrate business logic. Depends only on Domain. Receives ports (interfaces) via dependency injection.
- **Infrastructure Layer** — Implements ports. Handles external concerns: databases, AI APIs, PDF parsing, validation (Zod).
- **Presentation Layer** — Next.js pages (Vercel) and Express routes (Render). Both import from infrastructure via the DI container.

## Deployment

| Target | Service | Directory | Tech |
|--------|---------|-----------|------|
| **Vercel** | Frontend | `src/app/` (pages) | Next.js 16 |
| **Render** | Backend API | `server/` | Express + tsx |

All `/api/*` requests on Vercel are proxied to the Render backend via `vercel.json` rewrites.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + Express
- **Auth**: Better Auth (Google OAuth, @nsut.ac.in domain restriction)
- **Database**: PostgreSQL via Prisma v7
- **AI**: OpenCode Zen (deepseek-v4-flash-free) — resume parsing, README summarization, resume tailoring
- **PDF**: LaTeX compilation (pdflatex) on Render backend
- **Styling**: Tailwind CSS v4

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run the frontend (Next.js dev server)
npm run dev

# In another terminal — run the backend (Express server)
cd server
npm install
npm start
```

Visit `http://localhost:3000` and sign in with an `@nsut.ac.in` Google account.

## Environment Variables

See `.env.example` for all required variables. Must be configured in both Vercel and Render dashboards.
