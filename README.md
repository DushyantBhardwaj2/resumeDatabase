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
    │       ├── Dashboard: Home, Profile, History, Tailor
    │       ├── Coming Soon: Resumes, Roles, Templates, ATS Score, Analytics, Settings
    │       ├── UI Components (Button, Input, Card, Badge, Avatar, Dialog, etc.)
    │       └── @phosphor-icons/react
    │
    ├── Render (Express — Backend API)
    │       ├── /api/protected/* (authenticated routes: parse, profile, tailor, compile)
    │       ├── /api/health (unauthenticated)
    │       ├── LaTeX compilation (pdflatex)
    │       └── Shared domain/core layer (Clean Architecture)
    │
    ├── Supabase PostgreSQL (via Prisma v7)
    └── GitHub API (repo fetch, import)
```

Vercel proxies `/api/*` (except `/api/auth/*`) to Render via `vercel.json` rewrites. Auth is handled **directly on Vercel** to keep session cookies on the same domain.

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 16.2 (App Router, Turbopack), React 19, TypeScript |
| **Backend** | Express + tsx on Render |
| **Auth** | Better Auth v1.6 (Google OAuth, `@nsut.ac.in` domain restriction) |
| **Database** | Supabase PostgreSQL via Prisma v7 |
| **AI** | OpenCode Zen (`deepseek-v4-flash-free`) — parsing, tailoring, bullet generation |
| **PDF** | LaTeX compilation (pdflatex) on Render |
| **Styling** | Tailwind CSS v4, Satoshi/Inter/JetBrains Mono fonts |
| **Icons** | `@phosphor-icons/react` |
| **Testing** | Vitest 4 + React Testing Library + jsdom |
| **Deployment** | Vercel (frontend) + Render (backend) |

## UI Components

All in `src/components/ui/`: `Button` (4 variants, 3 sizes), `Input`/`Textarea`, `Badge` (6 colors), `Card` (3 variants), `Avatar`, `Dialog`, `Progress`, `Separator`, `Skeleton`, `Tooltip`.

Layout components in `src/components/layout/`: `AppLayout` (sidebar + mobile nav), `Sidebar` (228px desktop), `MobileNav` (header + drawer), `AuthLayout` (two-column split).

## Testing

```bash
npm test         # Run Vitest
npm run test:ui  # Vitest UI mode
```

3 test files: sign-in button rendering + click, auth redirect logic, auth flow configuration.

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
