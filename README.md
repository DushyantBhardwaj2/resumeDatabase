# Resumint

AI-powered resume tailoring platform for NSUT students.

## Architecture

```
User Browser
    │
    ├── Vercel (Next.js 16 — Frontend + Auth)
    │       │
    │       ├── AppLayout (Sidebar desktop + MobileNav drawer)
    │       ├── AuthLayout (two-column split for auth pages)
    │       ├── Better Auth (Google OAuth, session, domain restriction)
    │       ├── Career Vault & Split-Screen Tailoring Builder
    │       ├── UI Components (Button, Input, Card, Badge, Avatar, Dialog, etc.)
    │       └── Zustand Global State (useBuilderStore, useChatStore)
    │
    ├── Render (Express — Backend API)
    │       ├── /api/protected/* (all authenticated routes: chat, AI, compile)
    │       ├── /api/health (unauthenticated)
    │       ├── OpenCode Zen AI Orchestration (Intent Parser, Vault Expander)
    │       └── LaTeX compilation (pdflatex dynamic PDF generator)
    │
    ├── Supabase PostgreSQL (via Prisma v7)
    └── GitHub API (repo fetch, import)
```

Vercel proxies `/api/*` (except `/api/auth/*`) to Render via `vercel.json` rewrites. Auth is handled **directly on Vercel** to keep session cookies on the same domain. 
The backend middleware intercepts `/api/protected/*` and strictly enforces the `better-auth` session.

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 16.2 (App Router, Turbopack), React 19, TypeScript |
| **Backend** | Express + Hono + tsx on Render |
| **Auth** | Better Auth v1.6 (Google OAuth, `@nsut.ac.in` domain restriction) |
| **Database** | Supabase PostgreSQL via Prisma v7 |
| **AI** | OpenCode Zen (`deepseek-v4-flash-free`) — intent parsing, vault generation |
| **PDF** | LaTeX compilation (pdflatex) on Render |
| **Styling** | Tailwind CSS v4 (Glassmorphism), Satoshi/Inter/JetBrains Mono fonts |
| **State** | Zustand (Global stores for chat and split-screen builder) |
| **Icons** | `@phosphor-icons/react` |
| **Deployment**| Vercel (frontend) + Render (backend) |

## Core Features

- **Chat-Driven Onboarding:** A conversational AI interface to build your initial career vault.
- **Dynamic Vault Expansion:** AI expands simple project descriptions into 10-12 exhaustive bullet points.
- **Split-Screen Tailoring Builder:** A split view with the Chat Vault on the left and a live-compiling LaTeX PDF preview on the right.
- **ATS-Optimized PDF Export:** Server-side LaTeX compilation guarantees perfect, ATS-readable text extraction.

## Getting Started

```bash
# Install dependencies
npm install

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
