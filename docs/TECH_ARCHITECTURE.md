# Resumint — Technical Architecture Document

> Generated from codebase analysis. All statements derive directly from source code, configuration files, and dependency graphs. No features or intentions are invented.

---

## Table of Contents

1. [High Level Architecture](#1-high-level-architecture)
2. [Feature Map](#2-feature-map)
3. [Component Relationship Graph](#3-component-relationship-graph)
4. [Page Implementation](#4-page-implementation)
5. [Chat Architecture](#5-chat-architecture)
6. [Profile / Vault Architecture](#6-profile--vault-architecture)
7. [Builder Architecture](#7-builder-architecture)
8. [API Inventory](#8-api-inventory)
9. [Database](#9-database)
10. [AI System](#10-ai-system)
11. [State Management](#11-state-management)
12. [UI System](#12-ui-system)
13. [Extensibility](#13-extensibility)
14. [Refactor Risk](#14-refactor-risk)
15. [Product Redesign Readiness](#15-product-redesign-readiness)
16. [File Map](#16-file-map)
17. [Executive Summary](#17-executive-summary)

---

## 1. High Level Architecture

### Overall Architecture

Resumint is a **monorepo web application** with a **Next.js 16 frontend** and a **Hono backend**, deployed as two independent services. The frontend renders UI and proxies API calls to the backend. The backend handles business logic, AI integration, PDF compilation, and database access.

```
┌──────────────────────────────────────────────────────────┐
│                    Browser / Client                       │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────────────────┐
│                    Vercel (CDN + SSR)                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Next.js 16 (App Router)                │  │
│  │                                                     │  │
│  │  RSC (Server)          RCC (Client)                 │  │
│  │  ┌──────────────┐     ┌────────────────────┐       │  │
│  │  │ getServer    │     │ Zustand Stores     │       │  │
│  │  │ Session()    │     │ useChatStore       │       │  │
│  │  │              │     │ useBuilderStore    │       │  │
│  │  │ API calls    │     │ useProfileStore    │       │  │
│  │  │ (server-side)│     │                    │       │  │
│  │  └──────────────┘     │ Hono RPC Client    │       │  │
│  │                       └────────┬───────────┘       │  │
│  └────────────────────────────────┼───────────────────┘  │
└───────────────────────────────────┼──────────────────────┘
                                    │ HTTP + Cookies
                                    ▼
┌──────────────────────────────────────────────────────────┐
│                      Render (Docker)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Hono 4 (Node.js Server)                │  │
│  │                                                     │  │
│  │  Middleware Pipeline:                               │  │
│  │  CORS → Auth Check → Rate Limiter → Route Handler   │  │
│  │                                                     │  │
│  │  ┌───────────┐  ┌──────────┐  ┌────────────────┐   │  │
│  │  │ Use Cases │  │ Services │  │ Infrastructure │   │  │
│  │  │ Chat*     │  │ Bullet   │  │ AI Service     │   │  │
│  │  │ Profile*  │  │ Filter   │  │ PDF Parser     │   │  │
│  │  │ Resume*   │  │          │  │ LaTeX Template │   │  │
│  │  │ History*  │  │          │  │ BullMQ Queue   │   │  │
│  │  │ Github*   │  │          │  │ Rate Limiter   │   │  │
│  │  │ AI*       │  │          │  │ Logger (Pino)  │   │  │
│  │  └───────────┘  └──────────┘  └────────────────┘   │  │
│  └────────────────────┬────────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
   ┌────────────┐ ┌──────────┐ ┌──────────────┐
   │ PostgreSQL │  │  Redis   │  │  OpenAI-     │
   │ (Supabase) │  │(Render)  │  │  Compatible  │
   │            │  │          │  │  API         │
   │ Prisma ORM │  │ BullMQ   │  │              │
   │            │  │ Rate Lim │  │  (OpenCode   │
   │ JSON cols  │  │ Cache    │  │   / OpenAI)  │
   └────────────┘  └──────────┘  └──────────────┘
```

### Monorepo Structure

```
resumemint/
├── frontend/                       # Next.js 16 application
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── onboarding/        # Chat-driven profile creation
│   │   │   ├── dashboard/         # Main dashboard + sub-pages
│   │   │   ├── profile/           # Career Vault editor
│   │   │   ├── tailor/            # Resume tailoring flow
│   │   │   ├── history/           # Tailored resume history
│   │   │   ├── auth/              # OAuth redirect handler
│   │   │   ├── tips/              # Tips page
│   │   │   ├── access-denied/     # Access denied page
│   │   │   └── globals.css        # Design tokens + Tailwind
│   │   ├── components/            # React components
│   │   │   ├── ui/               # Primitive UI components
│   │   │   ├── chat/             # Chat system components
│   │   │   │   └── widgets/      # In-chat widget components
│   │   │   ├── layout/           # Layout components (Sidebar, AppLayout)
│   │   │   ├── generate/         # AI generation components
│   │   │   └── profile/          # Profile editor components
│   │   ├── config/               # Client config (API, Auth)
│   │   ├── store/                # Zustand stores
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utilities (normalize-profile, etc.)
│   │   └── types/                # TypeScript types
│   ├── public/
│   ├── scripts/
│   ├── tests/
│   └── e2e/
│
├── backend/                        # Hono Node.js server
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── env-init.ts           # Environment initialization
│   │   ├── config/               # Auth configuration
│   │   ├── interface/
│   │   │   ├── routes/           # HTTP route handlers
│   │   │   ├── schemas/          # Zod validation schemas
│   │   │   └── types.ts          # Hono context types
│   │   ├── core/
│   │   │   ├── application/
│   │   │   │   ├── use-cases/   # Business logic use cases
│   │   │   │   ├── ports/       # Port interfaces (AI, PDF, LaTeX)
│   │   │   │   └── services/    # Pure services (bullet-filter, DTOs)
│   │   │   └── domain/
│   │   │       ├── entities/    # Re-exports from shared
│   │   │       └── repositories/ # Repository interfaces
│   │   ├── infrastructure/
│   │   │   ├── prompts/         # AI system prompts
│   │   │   ├── queue/           # BullMQ worker + Redis
│   │   │   ├── latex/           # LaTeX template engine
│   │   │   └── logger.ts        # Pino logger
│   │   ├── di/                  # Dependency injection container
│   │   └── shared/              # Shared domain types (@resumint/shared)
│   ├── prisma/                   # Prisma schema + migrations
│   ├── scripts/                  # Build scripts
│   └── Dockerfile                # Docker container definition
│
├── packages/                      # (Unused — shared lives in backend/src/shared)
├── scripts/                       # Monorepo-level scripts
├── docs/                          # Documentation
├── .vercel/                       # Vercel project config
├── vercel.json                    # Vercel deployment config
├── render.yaml                    # Render service definitions
├── docker-compose.yml             # Local Redis
└── package.json                   # Workspace root
```

### Folder Responsibilities

| Folder | Role |
|---|---|
| `frontend/src/app/` | Page components, layouts, error boundaries (App Router) |
| `frontend/src/components/` | All reusable React components |
| `frontend/src/components/ui/` | Design-system primitives (Button, Card, Input, etc.) |
| `frontend/src/components/chat/` | Chat system (Container, Input, Bubbles, Widgets) |
| `frontend/src/components/layout/` | App layout, sidebar |
| `frontend/src/store/` | Zustand state stores |
| `frontend/src/config/` | API client (Hono RPC), auth client (BetterAuth) |
| `frontend/src/hooks/` | Custom hooks |
| `frontend/src/lib/` | Utilities |
| `backend/src/index.ts` | Hono app bootstrap, middleware, route mounting |
| `backend/src/interface/routes/` | HTTP route handlers (thin — call use cases) |
| `backend/src/core/application/use-cases/` | Business logic (Chat, Profile, Resume, AI, History, GitHub) |
| `backend/src/core/application/ports/` | Interface definitions (IAIService, IPDFParser, ILatexTemplateFiller) |
| `backend/src/core/domain/` | Domain entities (re-exported from shared) + repository interfaces |
| `backend/src/infrastructure/` | Implementations (AI service, PDF parser, LaTeX, queue, logger, rate limiter) |
| `backend/src/di/` | Dependency injection container (wires everything) |
| `backend/src/shared/` | Shared Zod schemas + TypeScript types (`@resumint/shared`) |

### Runtime Architecture

**Frontend (Next.js 16):**
- Development: `next dev` with Turbopack (port 3000)
- Dev mode API proxy: Next.js rewrites `/api/*` → `localhost:8080`
- Production: `next build` + `next start` (Vercel serverless)
- Build output: Static + serverless functions

**Backend (Hono on Render):**
- Development: `tsx watch src/index.ts` (port 8080)
- Production: TypeScript compiled to JavaScript via `tsc`, run with `node dist/index.js`
- Dockerized: Multi-stage Docker build (builder + runtime)

**Async Worker:**
- BullMQ worker runs in the same Node.js process (started by `startPdfWorker()`)
- Connected to separate Redis instance
- Handles LaTeX → PDF compilation

### Build System

| Command | System | Action |
|---|---|---|
| `npm run dev:frontend` | Next.js + Turbopack | Start frontend dev server |
| `npm run dev:backend` | tsx watch | Start backend dev server (hot reload) |
| `npm run build:frontend` | next build | Build frontend for production |
| `npm run build:backend` | tsc | TypeScript compile → dist/ |
| `npm run build` | Both | Build both |
| `npm run test:backend` | Vitest | Run backend tests (164 tests) |
| `npm run test:frontend` | Vitest | Run frontend tests |
| `npm run test` | Both | Run all tests |
| `npm run typecheck:frontend` | tsc --noEmit | Frontend type check |
| `npm run postinstall` | prisma generate | Generate Prisma client |

### Deployment Architecture

**Frontend (Vercel):**
- Git-triggered auto-deploy from `main` branch
- Framework auto-detected as Next.js
- Environment variables from Vercel dashboard
- DNS: Custom domain or `*.vercel.app`

**Backend (Render):**
- Docker-based web service from `main` branch
- `rootDir: backend` — builds from `/backend`
- Health check: `GET /api/health`
- Redis instance auto-provisioned via `render.yaml`
- Environment variables: sync false (set via Dashboard)
- Region: Oregon

**Preview Environments:**
- Vercel preview deployments for PRs
- Render previews: disabled (`"previews": {"generation": "off"}`)

### Frontend Lifecycle

```
Request
  ↓
Next.js middleware (proxy.ts)
  ├── Redirect old /tailor/builder → /tailor
  └── Check session cookies for /onboarding
       └── [No cookies] → redirect /
  ↓
App Router resolves page (app/layout.tsx → app/page.tsx)
  ├── RootLayout: ThemeProvider + Toaster
  ├── Server Component: fetches session + profile
  │   └── [No session] → redirect /
  │   └── [No profile] → redirect /onboarding
  └── Client Component: renders UI
       ├── Zustand store initialization
       ├── Hooks execution
       ├── API calls via Hono RPC client
       └── Component renders + animations
```

### Backend Lifecycle

```
Server Start (index.ts)
  ├── Load env vars (env-init.ts)
  ├── Create Hono app
  ├── Register CORS middleware
  ├── Register health endpoint
  ├── Register auth rate limiter
  ├── Register BetterAuth handler (/api/auth/**)
  ├── Register protected route middleware
  │   └── Check session → inject into context
  ├── Register rate limiters
  │   ├── AI: 10 req/hr
  │   ├── Compile: 15 req/min
  │   └── General: 100 req/min
  ├── Mount sub-routers
  ├── Start HTTP server (port 8080)
  └── Start BullMQ PDF worker

Request Lifecycle:
  Request → CORS check → Auth check (if /api/protected) → Rate limiter → Route handler
    → Route deserializes body → Calls use case → Use case orchestrates services
    → Response serialized → Returned

Use Case Lifecycle Example (Chat Interact):
  POST /api/protected/chat/interact
    → Parse body + session
    → ChatUseCases.parseIntent()
      → Build system prompt (CHAT_INTENT_PARSER + current phase)
      → Format conversation history
      → [Optional] URL scraping via Jina AI
      → Call AI service (generateStructuredData)
      → Validate AI response via Zod schema
      → Return { intent, targetWidget, reply, extractedData }
    → HTTP 200 JSON response
```

---

## 2. Feature Map

### F1: User Authentication

| Property | Value |
|---|---|
| **Purpose** | Sign in with Google OAuth, session management |
| **Frontend entry** | `components/sign-in-button.tsx`, `config/auth-client.ts` |
| **Backend endpoint** | `POST /api/auth/**` (BetterAuth handler) |
| **Database tables** | `User`, `Session`, `Account`, `Verification` |
| **AI usage** | None |
| **Components involved** | `SignInButton`, `AuthRedirectPage` |
| **Hooks** | `useSession()` from better-auth/react |
| **Stores** | None |
| **Shared types** | None (BetterAuth internal) |
| **Dependencies** | `better-auth`, Google OAuth provider |
| **Current limitations** | Only Google OAuth; no email/password, no magic link, no multi-tenant |

### F2: Chat-Driven Onboarding

| Property | Value |
|---|---|
| **Purpose** | Guide new users through Career Vault creation via AI chat |
| **Frontend entry** | `app/onboarding/page.tsx` |
| **Backend endpoint** | `POST /api/protected/chat/interact`, `POST /api/protected/resume/parse` |
| **Database tables** | `ChatMessage`, `Profile` |
| **AI usage** | Parse resume PDF, parse chat intent, generate profile data |
| **Components involved** | `ChatContainer`, `ChatInput`, `ResumeUploadWidget`, `OnboardingPreviewPanel` |
| **Hooks** | `useEffect` (init + phase transition) |
| **Stores** | `useChatStore` |
| **Shared types** | `ChatInteractRequest`, `ChatInteractResponse`, `OnboardingPhase` |
| **Dependencies** | AI service, PDF parser, Zustand |
| **Current limitations** | Only PDF upload (no DOCX); single-user path only; no skip option |

### F3: PDF Resume Parsing

| Property | Value |
|---|---|
| **Purpose** | Extract structured profile data from uploaded PDF resume |
| **Frontend entry** | `components/chat/widgets/ResumeUploadWidget.tsx` |
| **Backend endpoint** | `POST /api/protected/resume/parse` |
| **Database tables** | `Profile` (written after confirmation) |
| **AI usage** | AI generates structured JSON from extracted text |
| **Components involved** | `ResumeUploadWidget` |
| **Hooks** | None |
| **Stores** | `useChatStore.extractedData` |
| **Shared types** | `parsedResumeSchema` (Zod), `Profile` |
| **Dependencies** | `pdf-parse` (extract text), AI service (parse text → JSON) |
| **Current limitations** | PDF only, 5MB limit; AI parsing may hallucinate fields |

### F4: Dashboard

| Property | Value |
|---|---|
| **Purpose** | Show profile overview, stats, completeness, quick actions |
| **Frontend entry** | `app/dashboard/page.tsx` (SSR) |
| **Backend endpoint** | `GET /api/protected/profile` |
| **Database tables** | `Profile` |
| **AI usage** | None |
| **Components involved** | `DashboardWelcomeWidget`, `DashboardStatsWidget`, `DashboardCompletenessWidget`, `DashboardQuickActionsWidget` |
| **Hooks** | `useChatStore` (adds welcome messages) |
| **Stores** | `useChatStore` (DASHBOARD mode) |
| **Shared types** | `Profile` |
| **Dependencies** | `getServerSession`, `hasProfile` |
| **Current limitations** | ATS score hardcoded (82%); all sub-pages are empty shells |

### F5: Career Vault / Profile CRUD

| Property | Value |
|---|---|
| **Purpose** | Full profile management with auto-save and drafts |
| **Frontend entry** | `app/profile/page.tsx` |
| **Backend endpoint** | `GET /api/protected/profile`, `PATCH /api/protected/profile` |
| **Database tables** | `Profile` |
| **AI usage** | None (profile editing is manual) |
| **Components involved** | Profile editor components in `components/profile/` |
| **Hooks** | None |
| **Stores** | `useProfileStore` |
| **Shared types** | `Profile`, `Experience`, `Project`, `Skills`, `Contact`, etc. |
| **Dependencies** | `fast-deep-equal` (dirty checking), localStorage (drafts) |
| **Current limitations** | No conflict resolution; no optimistic updates for concurrent edits; JSON columns limit queryability |

### F6: Resume Tailoring

| Property | Value |
|---|---|
| **Purpose** | AI selects best bullets from Career Vault to match a job description |
| **Frontend entry** | `app/tailor/page.tsx` |
| **Backend endpoint** | `POST /api/protected/resume/tailor` |
| **Database tables** | `TailoredResume` (saves result), `Profile` (read) |
| **AI usage** | Bullet selection (match vault → JD), summary generation |
| **Components involved** | `ChatContainer`, `TailorInputWidget`, selection widgets, `LivePdfRenderer`, `Splitter` |
| **Hooks** | `useBuilderStore` |
| **Stores** | `useBuilderStore` (primary), `useChatStore` (TAILOR mode) |
| **Shared types** | `TailoredOutput`, `VaultBullet`, `BulletSelection` |
| **Dependencies** | AI service, LaTeX template engine |
| **Current limitations** | One JD at a time; no batch comparison; no cover letter generation |

### F7: Live PDF Compilation

| Property | Value |
|---|---|
| **Purpose** | Async LaTeX → PDF compilation with status polling |
| **Frontend entry** | `store/useBuilderStore.ts` (`triggerCompile()`) |
| **Backend endpoint** | `POST /api/protected/resume/compile-live`, `GET .../compile-status/:jobId`, `GET .../compile-result/:jobId` |
| **Database tables** | None (result stored in Redis with 5-min TTL) |
| **AI usage** | None |
| **Components involved** | `LivePdfRenderer` |
| **Hooks** | `useBuilderStore` |
| **Stores** | `useBuilderStore` (compile state machine, pdfUrl, zoom) |
| **Shared types** | `compileLiveSchema` (Zod) |
| **Dependencies** | BullMQ, Redis, LaTeX (`pdflatex` in Docker), `ioredis` |
| **Current limitations** | 5-min TTL on PDF results; 36s poll timeout (60 × 600ms); no download/export button detected in builder; single worker |

### F8: AI Bullet Generation

| Property | Value |
|---|---|
| **Purpose** | Generate professional resume bullets from raw text descriptions |
| **Frontend entry** | `components/ai-assisted-content.tsx` |
| **Backend endpoint** | `POST /api/protected/ai/generate-bullets` |
| **Database tables** | None |
| **AI usage** | AI generates bullets from raw input; section-specific prompts |
| **Components involved** | `AIAssistedContent` |
| **Hooks** | `useState` (internal mode: input → review → done) |
| **Stores** | None (local state only) |
| **Shared types** | `SectionType`, `GenerateBulletsOutput` |
| **Dependencies** | AI service |
| **Current limitations** | No streaming; one section at a time; prompt quality dependent |

### F9: Vault Expansion (AI)

| Property | Value |
|---|---|
| **Purpose** | Expand brief experience/project description into 12 comprehensive bullet points |
| **Frontend entry** | Not directly detectable; called from builder flow |
| **Backend endpoint** | `POST /api/protected/ai/expand-vault` |
| **Database tables** | None |
| **AI usage** | AI generates 12 categorized bullets from brief description |
| **Components involved** | Not detectable from UI code |
| **Hooks** | None |
| **Stores** | Not detectable |
| **Shared types** | `VaultExpansionRequest`, `VaultExpansionResponse` |
| **Dependencies** | AI service |
| **Current limitations** | Fixed count (12 bullets); no way to request more/fewer |

### F10: Bullet Selection (AI)

| Property | Value |
|---|---|
| **Purpose** | Recommend best 3-4 bullets per experience/project for a given JD |
| **Frontend entry** | Called during tailor flow (server-side) |
| **Backend endpoint** | `POST /api/protected/ai/select-bullets` |
| **Database tables** | None |
| **AI usage** | AI matches vault bullets against job description |
| **Components involved** | N/A (server-side, then selections sent to client) |
| **Hooks** | N/A |
| **Stores** | N/A |
| **Shared types** | `BulletSelectionRequest`, `BulletSelectionResponse` |
| **Dependencies** | AI service |
| **Current limitations** | Selection runs once per tailor; no iterative refinement |

### F11: GitHub Repository Import

| Property | Value |
|---|---|
| **Purpose** | Import GitHub repos, read README, generate bullets |
| **Frontend entry** | Not directly detectable from UI code |
| **Backend endpoint** | No direct HTTP endpoint; logic in `github-use-cases.ts` |
| **Database tables** | `GitHubRepo`, `Profile` |
| **AI usage** | Generate bullet points from README content |
| **Components involved** | Not detectable |
| **Hooks** | None |
| **Stores** | None |
| **Shared types** | `GitHubRepoInfo`, `AiGeneratedProject` |
| **Dependencies** | GitHub API (unauthenticated README fetch), AI service |
| **Current limitations** | Unauthenticated GitHub API (rate limited); README only; no multiple file analysis |

### F12: Tailoring History

| Property | Value |
|---|---|
| **Purpose** | Browse, view, delete previously tailored resumes |
| **Frontend entry** | `app/history/page.tsx` |
| **Backend endpoint** | `GET /api/protected/history`, `GET .../:id`, `DELETE .../:id`, `PATCH .../:id`, `PUT .../:id/styling` |
| **Database tables** | `TailoredResume` |
| **AI usage** | None |
| **Components involved** | Not analyzed in detail (not fully explored) |
| **Hooks** | None |
| **Stores** | None |
| **Shared types** | None |
| **Dependencies** | Prisma `TailoredResume` table |
| **Current limitations** | No search/filter beyond optional `search` param; no comparison view |

### F13: Chat History

| Property | Value |
|---|---|
| **Purpose** | Save and load chat messages per user per mode |
| **Frontend entry** | `store/useChatStore.ts` (`loadHistory`, `sendMessage` persistence) |
| **Backend endpoint** | `GET /api/protected/chat/history`, `POST /api/protected/chat/save` |
| **Database tables** | `ChatMessage` |
| **AI usage** | None (storage only) |
| **Components involved** | `ChatContainer`, `ChatInput` |
| **Hooks** | `useChatStore` |
| **Stores** | `useChatStore` |
| **Shared types** | `ChatMessage`, `saveMessageSchema` |
| **Dependencies** | Prisma `ChatMessage` table |
| **Current limitations** | No message editing; no conversation branching; no export |

---

## 3. Component Relationship Graph

### Landing Page (`/`)

```
LandingPage (Server Component)
├── SignInButton (Client)
│   └── authClient.signIn()
├── Link → /dashboard
├── Link → /dashboard (Career Vault)
└── Link → /tailor
```

### Onboarding (`/onboarding`)

```
OnboardingPage (Client)
├── ChatContainer (Client)
│   └── ChatMessage[]
│       ├── MessageBubble
│       │   └── ResumeUploadWidget (when widget='UPLOAD_DROPZONE')
│       └── MessageBubble (text)
├── ChatInput (Client)
│   └── → useChatStore.sendMessage()
└── OnboardingPreviewPanel (Client)
    └── → useChatStore.extractedData
```

### Dashboard (`/dashboard`)

```
DashboardLayout (Server)
├── AppLayout (Server)
│   └── Sidebar (Client)
│       ├── NavLink[] (Home, Career Vault, Tailor, History)
│       ├── HistoryList (recent tailors)
│       ├── ThemeToggle
│       └── Sign Out button
└── DashboardPage (Server)
    └── DashboardWidgets
        ├── DashboardWelcomeWidget (Server)
        ├── DashboardStatsWidget (Server)
        ├── DashboardCompletenessWidget (Server)
        ├── AtsWidget (inline, Server)
        └── DashboardQuickActionsWidget (Server)
```

### Profile Vault (`/profile`)

```
ProfileLayout (Server)
├── AppLayout (Server)
│   └── Sidebar (Client)
└── ProfilePage (Client)
    ├── → useProfileStore.loadProfile()
    ├── Contact editor
    ├── Education editor
    ├── Experience editor
    │   └── VaultBullet editor
    ├── Projects editor
    │   └── VaultBullet editor
    ├── Skills editor
    ├── Certificates editor
    └── Extracurriculars editor
```

### Tailor (`/tailor`)

```
TailorLayout (Server)
├── AppLayout (Server)
│   └── Sidebar (Client)
└── TailorPage (Client)
    ├── → useProfileStore.loadProfile() + useBuilderStore.setProfile()
    ├── Splitter (draggable divider)
    ├── Left Panel: ChatContainer (TAILOR mode)
    │   ├── MessageBubble → TailorInputWidget (job description form)
    │   ├── MessageBubble → Experience selection checkboxes
    │   ├── MessageBubble → Project selection checkboxes
    │   ├── MessageBubble → Bullet selection checkboxes
    │   └── MessageBubble → Contact selection form
    └── Right Panel: LivePdfRenderer
        └── → useBuilderStore.pdfUrl (PDF blob via <iframe>/<embed>)
```

### History (`/history`)

```
HistoryLayout (Server)
├── AppLayout (Server)
│   └── Sidebar (Client)
└── HistoryPage (Client)
    └── History list
        └── HistoryItem (per tailored resume)
```

### Component Dependency Hierarchy (UI)

```
AppLayout
├── Sidebar
│   ├── Avatar
│   ├── NavLink[]
│   ├── ThemeToggle
│   └── SidebarHistoryList
│
├── Page Content
│   ├── Card
│   │   ├── CardHeader
│   │   ├── CardTitle
│   │   ├── CardDescription
│   │   ├── CardContent
│   │   └── CardFooter
│   ├── Button
│   ├── Badge
│   ├── Input
│   ├── Textarea
│   ├── Progress
│   ├── Separator
│   ├── Tooltip
│   ├── Skeleton
│   ├── SkeletonText
│   ├── SkeletonTitle
│   ├── SkeletonCard
│   ├── Dialog
│   ├── BorderGlow
│   ├── ChromaGrid (GSAP)
│   ├── AnimatedList (motion)
│   ├── ChatContainer
│   │   ├── ChatMessage[]
│   │   │   ├── MessageBubble
│   │   │   └── Embedded widgets
│   │   └── ChatInput
│   └── Splitter (for tailor)
```

---

## 4. Page Implementation

### Landing Page (`/`)

| Aspect | Detail |
|---|---|
| **Why it exists** | Public marketing page; entry point for unauthenticated users |
| **Components rendered** | `SignInButton`, inline SVG icons, Link cards |
| **Data flow** | Static server component — no data fetching |
| **State shared** | None |
| **Server Components** | Entire page (no `'use client'`) |
| **Client Components** | Only `SignInButton` (needs interactivity) |
| **Hooks** | None |
| **API calls** | None |
| **Animations** | `animate-fade-up` with staggered delays (base, d1-d4) |
| **Styling** | Tailwind utility classes, CSS custom properties |
| **Potential coupling** | None — fully isolated landing page |

### Onboarding (`/onboarding`)

| Aspect | Detail |
|---|---|
| **Why it exists** | First-run experience; required before accessing any authenticated feature |
| **Components rendered** | `ChatContainer`, `ChatInput`, `OnboardingPreviewPanel`, `ResumeUploadWidget` |
| **Data flow** | 1. SSR checks session → loads chat history → adds greeting → 2. User uploads file → widget POSTs to parse endpoint → 3. extractedData stored in Zustand → 4. User types → sendMessage POSTs to interact → 5. AI returns intent → phase updates → 6. Phase='COMPLETE' triggers profile POST → 7. Redirect to /dashboard |
| **State shared** | `useChatStore` (messagesByMode['ONBOARDING'], currentPhase, extractedData, isTyping) |
| **Server Components** | None (entire page is client-rendered) |
| **Client Components** | Full page |
| **Hooks** | `useEffect` × 2 (init, phase-complete), `useRef` (init guard), `useState` (completing) |
| **API calls** (client) | `POST /api/protected/resume/parse`, `POST /api/protected/chat/interact`, `POST /api/protected/profile` |
| **API calls** (init) | `GET /api/protected/profile` (checks for existing profile) |
| **Animations** | `animate-fade-in` (background orbs), `animate-fade-up` (header, panels), `animate-pulse` (status dot) |
| **Styling** | Glass panels, flexbox split-screen, backdrop blur |
| **Potential coupling** | Tightly coupled to `useChatStore` — phase transition logic in both store and page useEffect; extractedData flow depends on widget implementation; page hardcodes the COMPLETE → POST /profile → /dashboard redirect chain |

### Dashboard (`/dashboard`)

| Aspect | Detail |
|---|---|
| **Why it exists** | Central hub; first page after auth/onboarding |
| **Components rendered** | `DashboardWelcomeWidget`, `DashboardStatsWidget`, `DashboardCompletenessWidget`, `DashboardQuickActionsWidget`, `AtsWidget` (inline) |
| **Data flow** | Server fetches session + profile → passes as props to widgets → client-side DashboardChatClient adds messages to chat store |
| **State shared** | `useChatStore` (DASHBOARD mode — welcome messages added client-side) |
| **Server Components** | `DashboardPage` (server-rendered), widgets (server-renderable) |
| **Client Components** | `DashboardChatClient` (adds messages to store) |
| **Hooks** | `useEffect` (init dashboard messages) |
| **API calls** (server) | `GET /api/protected/profile` |
| **Animations** | `animate-fade-up` with d1-d4 staggering across widget cards |
| **Potential coupling** | ATS score widget hardcodes 82% with animation; dashboard-chat-client duplicates data shown in server widgets via chat store; "Coming Soon" sub-pages are unreachable from dashboard UI (no links visible) |

### Profile (`/profile`)

| Aspect | Detail |
|---|---|
| **Why it exists** | Full Career Vault editor; separate from chat-driven editing |
| **Data flow** | `useProfileStore.loadProfile()` → `GET /api/protected/profile` → normalized → rendered → edits → auto-save debounce → `PATCH /api/protected/profile` |
| **State shared** | `useProfileStore` (entirely self-contained) |
| **Server Components** | Layout only (`AppLayout`) |
| **Client Components** | Full page |
| **Hooks** | `useEffect` (load profile) |
| **API calls** (client) | `GET /api/protected/profile`, `PATCH /api/protected/profile` |
| **Potential coupling** | Auto-save and draft logic entirely inside the store; no conflict detection; `PATCH` sends entire profile object (not partial) |

### Tailor (`/tailor`)

| Aspect | Detail |
|---|---|
| **Why it exists** | Core feature — tailor resume to specific job description |
| **Data flow** | Profile loaded → builder store initialized → user enters JD → `POST /api/protected/resume/tailor` (AI selection) → selections populate → user toggles → `triggerCompile()` enqueues PDF → polls status → fetches blob → LivePdfRenderer updates |
| **State shared** | `useBuilderStore` (all tailoring state), `useChatStore` (TAILOR mode messages) |
| **Server Components** | Layout only |
| **Client Components** | Full page, split-screen layout |
| **Hooks** | `useEffect` (init), `useRef` (init guard), `useCallback` (sidebar render) |
| **API calls** (client) | `GET /api/protected/profile`, `POST /api/protected/resume/tailor`, `POST /api/protected/resume/compile-live`, polling `GET compile-status/:jobId`, `GET compile-result/:jobId` |
| **Potential coupling** | Tightly coupled to `useBuilderStore` compile state machine; chat messages and builder state coexist but don't sync bidirectionally; PDF compilation relies on external Redis + LaTeX in Docker |

### History (`/history`)

| Aspect | Detail |
|---|---|
| **Why it exists** | Browsing previously tailored resumes |
| **Data flow** | Load list → render → click for details / delete |
| **State shared** | None (local state) |
| **Server Components** | Layout only |
| **Client Components** | Full page |
| **API calls** (client) | `GET /api/protected/history`, various by ID |

---

## 5. Chat Architecture

### Purpose

The chat system is the **primary interaction paradigm** for the application. It handles onboarding guidance, dashboard widget injection, and tailor workflow progression. It is NOT a standalone messaging feature — it IS the application shell.

### Message Lifecycle

```
User types text
  ↓
ChatInput.onSend(text)
  ↓
useChatStore.sendMessage(text)
  │
  ├── 1. Add user message to store (immediate render)
  │   └── set({ messagesByMode, isTyping: true })
  │
  ├── 2. POST /api/protected/chat/interact
  │   └── Body: { messages, currentState: { phase }, mode }
  │
  │   ┌── Backend ───────────────────────────────────────────┐
  │   │  3. ChatUseCases.parseIntent()                        │
  │   │     ├── Build system prompt = CHAT_INTENT_PARSER       │
  │   │     │   + "\nThe user is currently in phase: {phase}" │
  │   │     ├── Format conversation: "User: ...\nAssistant:.." │
  │   │     ├── [Optional] URL scraping via Jina AI            │
  │   │     ├── AI.generateStructuredData()                    │
  │   │     ├── Zod validate response                          │
  │   │     │   ├── [Success] → return { intent, targetWidget,│
  │   │     │   │                 reply, extractedData }       │
  │   │     │   └── [Error] → fallback response               │
  │   │     └── Return to frontend                             │
  │   └──────────────────────────────────────────────────────┘
  │
  ├── 4. Add assistant message to store
  │   └── set({ messagesByMode, isTyping: false, 
  │             extractedData (merges), currentPhase (if NAVIGATE) })
  │
  └── 5. Background persist (fire-and-forget)
      ├── POST /api/protected/chat/save (user message)
      └── POST /api/protected/chat/save (assistant message, if reply)
```

### Store Lifecycle

```
useChatStore (singleton)
│
├── messagesByMode: {
│     ONBOARDING: ChatMessage[],   ← Onboarding page
│     BUILDER:    ChatMessage[],   ← Builder flow (unused? deprecated)
│     DASHBOARD:  ChatMessage[],   ← Dashboard widget messages
│     TAILOR:     ChatMessage[],   ← Tailor wizard messages
│     PROFILE:    ChatMessage[],   ← Profile assistant
│   }
│
├── currentPhase: OnboardingPhase  ← GREETING → COMPLETE
├── isTyping: boolean               ← Loading indicator
├── mode: ChatMode                  ← Which mode is active
├── extractedData: Record           ← AI-parsed profile data
│
├── addMessage(msg)                 ← Append to current mode
├── sendMessage(text)               ← Full lifecycle (above)
├── loadHistory(mode)               ← GET /api/protected/chat/history
├── setPhase(phase)                 ← Manual override
├── setMode(mode)                   ← Switch mode
└── clearChat()                     ← Clear current mode
```

### Backend Flow

```
ChatInteractRequest {
  messages: [{ role, content }]
  currentState?: { phase }
}
  ↓
ChatUseCases.parseIntent(request)
  ├── 1. Build system prompt
  │   = CHAT_INTENT_PARSER + "\nThe user is currently in phase: {phase}"
  ├── 2. Format messages
  │   = Filter out system messages
  │   = Map to "User: ...\nAssistant: ..."
  ├── 3. [Optional] URL scanning
  │   = Extract URLs from last user message
  │   = Fetch via https://r.jina.ai/{url}
  │   = Append scraped content as [System Context]
  ├── 4. Call AI
  │   = this.aiService.generateStructuredData(systemPrompt, messagesForAI, schema)
  ├── 5. Validate
  │   = chatInteractAISchema.parse(aiResponse)
  │   = Returns { intent, targetWidget, reply, extractedData }
  └── 6. Return ChatInteractResponse
```

### Prompt Generation

The `CHAT_INTENT_PARSER` prompt (in `backend/src/infrastructure/prompts/index.ts`) is a static system prompt that:

- Describes 4 intents: `PROVIDE_DATA`, `NAVIGATE`, `GENERAL_CHAT`, `GENERATE_PROFILE_DATA`
- Enumerates 8 targetWidget values: `CONTACT`, `EXPERIENCE`, `PROJECTS`, `SKILLS`, `CERTIFICATES`, `REVIEW`, `UPLOAD_DROPZONE`, `PROFILE_GENERATOR`
- Specifies JSON output schema
- Has URL scraping instructions
- Has edit/delete instructions
- Has "add entry" instructions
- Has post-upload confirmation flow instructions
- Includes 7 few-shot examples

The prompt is **static and bundled** — it cannot be modified at runtime. It is injected into the `ChatUseCases` constructor via the DI container.

### History

- Messages are persisted to `ChatMessage` table in PostgreSQL
- `mode` column distinguishes which chat mode the message belongs to
- `widget` column stores the widget type for assistant messages
- Messages loaded via `GET /api/protected/chat/history?mode=X`
- No message limit, no cleanup, no TTL detected

### Widgets

Widgets are **embedded UI components** triggered by the `widget` field on assistant `ChatMessage` objects.

**How widgets appear:**

1. AI returns `{ intent: "NAVIGATE", targetWidget: "UPLOAD_DROPZONE" }`
2. Frontend creates assistant message with `widget: "UPLOAD_DROPZONE"`
3. `MessageBubble` renders widget based on string → component mapping
4. Widget can interact independently (e.g., `ResumeUploadWidget` makes its own API calls)
5. Widget can modify chat store (e.g., `useChatStore.setState({ extractedData })`)

**Widget → Component mapping (inferred):**

| widget string | Component | Mode(s) | API calls |
|---|---|---|---|
| `UPLOAD_DROPZONE` | `ResumeUploadWidget` | ONBOARDING | POST /resume/parse |
| `DASHBOARD_WELCOME` | `DashboardWelcomeWidget` | DASHBOARD | None |
| `DASHBOARD_STATS` | `DashboardStatsWidget` | DASHBOARD | None |
| `DASHBOARD_COMPLETENESS` | `DashboardCompletenessWidget` | DASHBOARD | None |
| `DASHBOARD_QUICK_ACTIONS` | `DashboardQuickActionsWidget` | DASHBOARD | None |
| `TAILOR_INPUT` | `TailorInputWidget` | TAILOR | POST /resume/tailor |
| `PROFILE_GENERATOR` | `ProfileGeneratorWidget` | ONBOARDING/TAILOR | POST /ai/generate-bullets |
| `CONTACT`/`EXPERIENCE`/`PROJECTS`/`SKILLS`/`CERTIFICATES` | Selection/checklist widgets | TAILOR | None (local state) |

### AI Routing

The AI determines **everything** about the chat response — what to say, what widget to show, what state to change, what data to extract. The frontend is a thin rendering layer that executes the AI's decisions.

**What the AI controls:**
- `reply`: The text response shown to the user
- `intent`: What kind of response this is (determines state transitions)
- `targetWidget`: Which widget to render (triggers phase changes + UI)
- `extractedData`: Data to merge into the store

**What the frontend controls:**
- Initial greeting (added in page useEffect, not from AI)
- Phase mapping via `mapWidgetToPhase()` (NAVIGATE + targetWidget → OnboardingPhase)
- When to save the profile (currentPhase === 'COMPLETE' triggers page effect)

### Current Limitations

1. **No streaming**: The entire response is awaited before display. No SSE or WebSocket.
2. **Full history sent every time**: No truncation or sliding window. Long conversations will exceed token limits.
3. **Static prompt**: `CHAT_INTENT_PARSER` is hardcoded. Cannot be modified per-user or per-session.
4. **Phase only goes forward**: The `mapWidgetToPhase` function only maps NAVIGATE → NEW_PHASE, but there's no way to go back to a previous phase.
5. **Widget ↔ Store coupling**: Widgets directly modify store state via `useChatStore.setState()`. This bypasses the normal `sendMessage` lifecycle.
6. **No error recovery for persist**: Chat message persistence is fire-and-forget (`.catch(() => {})`). Failures are silently swallowed.
7. **Messages not editable**: No edit, delete, or retry for individual messages.
8. **History never cleaned**: `ChatMessage` table grows unbounded. No TTL or cleanup cron.

### Key Architectural Questions (Answered from Code)

**Can chat become global?**
Currently, chat is mode-scoped (`messagesByMode` is a `Record<ChatMode, ChatMessage[]>`). Each mode has independent history. Making chat global would require merging or cross-referencing modes.

**Can chat be reused?**
The `ChatContainer` accepts a `mode` prop. It renders messages for that mode. The store's `sendMessage` operates on the current `mode`. Reusing chat in a new context only requires creating a new `ChatMode` entry.

**Can pages inject widgets?**
Yes — any page can call `addMessage()` with a `widget` field. The `MessageBubble` component renders the widget based on the string value. This is demonstrated by the onboarding page adding the initial greeting with `widget: 'UPLOAD_DROPZONE'`.

**Can pages inject prompts?**
No. The system prompt is hardcoded in `CHAT_INTENT_PARSER` on the backend. There's no mechanism for pages to modify or extend AI prompts at runtime.

**How tightly coupled is chat?**
- Chat is tightly coupled to the onboarding flow (phase transitions, profile save trigger)
- Chat is moderately coupled to the builder (TAILOR mode message flow)
- Chat is loosely coupled to the dashboard (messages added but not essential for rendering)
- Widget rendering is tightly coupled (MessageBubble must know about every widget type)

---

## 6. Profile / Vault Architecture

### Data Model

The `Profile` is stored as a **single row per user** with **JSON columns** for flexible sections:

```prisma
model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation
  githubUsername   String?
  rawResumeText   String?
  contact         Json?    // Contact object
  education       Json?    // Education[]
  experience      Json?    // Experience[]
  projects        Json?    // Project[]
  skills          Json?    // Skills { languages, frameworks, tools }
  leadership      Json?    // (detected but not actively used)
  certificates    Json?    // Certificate[]
  achievements    Json?    // (detected but not actively used)
  extracurriculars Json?   // ExtracurricularItem[]
}
```

All sections use **Zod schemas** in `backend/src/shared/index.ts` for validation:

| Section | Zod Schema | Key Fields |
|---|---|---|
| contact | `contactSchema` | name, email, phone, linkedin, github, leetcode, portfolio + plural variants |
| education | `educationSchema[]` | school, degree, gpa, startYear, endYear |
| experience | `experienceSchema[]` | company, role, startDate, endDate, current, vaultBullets |
| projects | `projectSchema[]` | title, url, techStack, vaultBullets |
| skills | `skillsSchema` | languages[], frameworks[], tools[] |
| certificates | `certificateSchema[]` | name, issuer, url, date |
| extracurriculars | `extracurricularItemSchema[]` | title, description, date |

### VaultBullet System

Each `Experience` and `Project` contains an array of `VaultBullet` objects:

```typescript
interface VaultBullet {
  id: string           // UUID
  text: string         // The bullet point text
  category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL"
  keywords: string[]   // AI-generated keywords for matching
  isAIGenerated: boolean
}
```

Bullets are the **atomic unit** of the tailoring system. The AI selects individual bullets to match a job description.

### CRUD Operations

| Operation | Frontend | Backend | AI |
|---|---|---|---|
| **Create** | Onboarding chat → POST /profile | `saveFromOnboarding()` | AI parses resume/intent → structured data |
| **Read** | GET /api/protected/profile | `findByUserId()` | None |
| **Update** | PATCH /api/protected/profile | `upsert()` | None |
| **Delete** | (field-by-field via PATCH) | `upsert()` with empty fields | None |
| **AI Generate** | POST /ai/generate-bullets | AI generates → manual accept | Generates bullets from raw text |
| **AI Expand** | POST /ai/expand-vault | AI expands → 12 bullets | Generates from brief description |

### Auto-Save System (Frontend)

```
Edit action (addProject, updateSkills, deleteExperience, etc.)
  ↓
useProfileStore.updateProfile(updatedProfile)
  ├── set({ profile: updated })
  ├── localStorage.setItem('profile-draft', JSON.stringify(updated))
  └── scheduleSave()
        └── clearTimeout(saveTimer)      // Debounce: cancel pending
            setTimeout(() => saveProfile(), 500ms)
              ↓
saveProfile()
  ├── isEqual(profile, originalProfile)? → return (not dirty)
  ├── set({ saving: 'saving' })
  ├── PATCH /api/protected/profile
  │   └── Body: full profile object
  ├── [Success] → set({ saving: 'saved' })
  │   → localStorage.removeItem('profile-draft')
  │   → setTimeout(() → set({ saving: 'idle' }), 2000)
  └── [Failure] → set({ saving: 'error' })
      → toast error
```

### Synchronization

- **Server ↔ Store**: Loaded once via `loadProfile()`, saved via `PATCH`
- **Drafts**: Written to localStorage on every edit, removed on successful save
- **Dirty check**: `fast-deep-equal` compares current profile to original snapshot
- **Race conditions**: No conflict detection — if the profile was updated elsewhere, the PATCH blindly overwrites

### Relationships

```
User 1──1 Profile
User 1──N TailoredResume
User 1──N GitHubRepo
User 1──N ChatMessage
TailoredResume — references User (no FK to Profile — profile data is embedded in tailoredData JSON)
```

### How AI Modifies the Profile

1. **Onboarding**: AI parses resume → structured data → `extractedData` in chat store → `POST /api/protected/profile`
2. **Bullet generation**: AI generates bullets from raw text → user reviews → accepts → stored in profile
3. **Vault expansion**: AI expands brief description → 12 bullets → stored as experience/project vaultBullets
4. **Tailoring**: AI selects bullets → does NOT modify profile — creates a new `TailoredResume` with filtered bullets

### How Tailoring Consumes Profile

```
profile = await profileUseCases.getProfile(userId)
  ↓
assignItemIds(profile)  // Ensure every experience/project has an id
  ↓
compactProfile = { experience, projects, skills }  // Strip metadata
  ↓
AI selects: selectedExperienceIds, selectedProjectIds, selections[vaultBullets], skills
  ↓
buildTailoredFromSelections()  // Filter experience/projects/bullets
  ↓
applyTemplateConstraints()    // Truncate to template limits
  ↓
latexTemplate.fill()          // Generate LaTeX source
  ↓
Save to TailoredResume table
```

### What Can Safely Be Extended

- Adding new JSON fields to the Profile schema (no migrations needed — just update Zod schema)
- Adding new section types to the Profile (e.g., `publications`, `volunteering`)
- Adding new template types (just add a LaTeX template file)
- Adding new chat modes (just add a string to `ChatMode` union)

---

## 7. Builder Architecture

### Builder State (useBuilderStore)

```
useBuilderStore
│
├── Input State
│   ├── profile: Profile | null
│   ├── jobTitle: string
│   ├── company: string
│   └── jobDescription: string
│
├── Selection State
│   ├── selectedBulletIds: Record<string, string[]>  // itemId → bulletId[]
│   ├── selectedExperienceIds: string[]
│   ├── selectedProjectIds: string[]
│   ├── selectedEducationIds: string[]
│   └── contactSelection: ResumeContactSelection
│
├── Compile State Machine
│   ├── isCompiling: boolean
│   ├── status: GenerationStatus  // idle | selecting | queued | compiling | ready | error
│   └── currentStage: CurrentStage  // idle | collecting | generating | reviewing | compiling | ready | error
│
├── Preview State
│   ├── pdfUrl: string | null       // Blob URL
│   └── zoom: number (50-200)
│
├── Config State
│   ├── template: TemplateType      // nsut-canonical | ats-clean | modern | compact
│   └── documentType: DocumentType   // resume | cv | both
│
└── Actions
    ├── setProfile(profile)          // Initialize all selections (all selected by default)
    ├── toggleBullet(itemId, bulletId)
    ├── toggleExperience(id)
    ├── toggleProject(id)
    ├── toggleEducation(id)
    ├── setContactSelection(contact)
    ├── triggerCompile()             // Full compile lifecycle
    └── reset()
```

### Selection Logic

- **Default**: When `setProfile()` is called, ALL items and ALL bullets are selected
- **ToggleBullet**: Adds/removes a bullet ID from `selectedBulletIds[itemId]`, preserves original order
- **ToggleExperience/Project/Education**: Adds/removes from the respective ID array, preserves original order
- **Order preservation**: All sorted by index in the original profile array

### PDF Generation Flow

```
triggerCompile()
  │
  ├── Abort previous polling (if any)
  │
  ├── set({ isCompiling: true, status: 'queued' })
  │
  ├── Step 1: Enqueue
  │   POST /api/protected/resume/compile-live
  │   Body: { profile, selectedBulletIds, selectedExperienceIds,
  │           selectedProjectIds, selectedEducationIds,
  │           contactSelection, templateId }
  │   Response: { jobId }
  │
  ├── Step 2: Poll status (up to 60 × 600ms = 36s)
  │   GET /api/protected/resume/compile-status/:jobId
  │   ├── 'queued' → continue polling (every 600ms)
  │   ├── 'active' → set({ status: 'compiling' })
  │   ├── 'completed' → goto Step 3
  │   ├── 'failed' → throw error
  │   └── timeout (36s) → throw error
  │
  ├── Step 3: Fetch PDF
  │   GET /api/protected/resume/compile-result/:jobId
  │   → blob → URL.createObjectURL(blob)
  │   → set({ pdfUrl, status: 'ready' })
  │
  └── Error handling
      ├── AbortError (newer compile triggered) → silent discard
      ├── Network error → toast + set({ status: 'error' })
      └── Poll timeout → toast + set({ status: 'error' })
```

### Backend Compile Flow

```
POST /api/protected/resume/compile-live
  │
  ├── Validate body (compileLiveSchema)
  ├── Filter experience by selectedExperienceIds
  ├── Filter projects by selectedProjectIds
  ├── filterExperienceBySelection(experience, selectedBulletIds)
  │   └── Keep only bullets whose IDs are in selections[itemId]
  ├── filterProjectsBySelection(projects, selectedBulletIds)
  ├── Filter education by selectedEducationIds
  ├── Merge contactSelection into profile.contact
  ├── template.fill(templateId, contact, education, experience, projects, skills, tailored, extracurriculars)
  │   └── Uses LaTeX template engine (EJS-like syntax)
  ├── addPdfJob({ latexSource, templateId })
  │   └── BullMQ job added to 'pdf-compilation' queue
  └── Return { jobId }
```

### Template System

Templates are defined as:
1. **LaTeX template files** stored at `backend/src/infrastructure/latex/templates/` (copied to dist/ at build time)
2. **TemplateConfig** objects defining placeholder metadata (max entries, max bullets, section fields)
3. **Template IDs**: `nsut-canonical`, `ats-clean`, `modern`, `compact`

The `LatexTemplateFiller` fills placeholders in the .tex template with actual profile data. The result is a complete LaTeX document.

### Compilation (BullMQ Worker)

```
BullMQ Queue: 'pdf-compilation'
  │
  Worker (same Node.js process)
  ├── Receive job: { latexSource, templateId }
  ├── Write .tex to temp directory
  ├── Run: pdflatex -interaction=nonstopmode {file}.tex
  ├── [Success] → Read .pdf → base64 encode → redis.set(`pdf:result:${jobId}`, encoded, 'EX', 300)
  └── [Failure] → throw error (job marked failed)
```

### Current Bottlenecks

1. **Compilation is synchronous in Node.js**: `pdflatex` is a child process. The BullMQ worker runs in the same Node.js process, so a stalled compilation blocks the event loop.
2. **PDF stored in Redis with 5-min TTL**: Expired results require re-compilation.
3. **Full profile sent in request body**: `compile-live` POST includes the entire profile JSON. For large profiles, this increases latency.
4. **AbortController race**: If a user adjusts selections rapidly, each change cancels the previous compile via AbortController. This is correct behavior but generates unnecessary load.
5. **No incremental compilation**: Every selection change triggers a full re-compile. No caching of intermediate LaTeX.
6. **Single worker**: No worker concurrency. Compilations are serial.

---

## 8. API Inventory

### Health & Auth

| Method | Route | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/health` | Health check | No | — | `{ status: "ok", timestamp }` |
| POST | `/api/auth/**` | BetterAuth handlers | No | Varies | Varies |
| GET | `/api/auth/**` | BetterAuth handlers | No | Varies | Varies |

### Profile

| Method | Route | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/protected/profile` | Get user profile | Yes | — | `Profile` + `completeness` or `null` |
| POST | `/api/protected/profile` | Save onboarding data | Yes | `{ rawText?, parsed }` | `Profile` |
| PATCH | `/api/protected/profile` | Update profile | Yes | `Partial<Profile>` | `Profile` |

### Resume

| Method | Route | Purpose | Auth | Rate Limit |
|---|---|---|---|---|
| POST | `/api/protected/resume/parse` | Parse uploaded PDF | Yes | 10/hr (AI) |
| POST | `/api/protected/resume/tailor` | AI tailor to JD | Yes | 10/hr (AI) |
| POST | `/api/protected/resume/compile-live` | Queue PDF compilation | Yes | 15/min |
| GET | `/api/protected/resume/compile-status/:jobId` | Poll compile status | Yes | — |
| GET | `/api/protected/resume/compile-result/:jobId` | Fetch compiled PDF | Yes | — |

**Parse Request:** Multipart form with `file` (PDF, ≤5MB)
**Parse Response:** `{ rawText: string, parsed: Profile }` or `{ fromDb: true, parsed: Profile }`

**Tailor Request:** `{ jobTitle, company, jobDescription }`
**Tailor Response:** `{ jobTitle, company, original: Profile, tailored: TailoredOutput, latex: string }`

**Compile-live Request:** `{ profile, selectedBulletIds, selectedExperienceIds, selectedProjectIds, selectedEducationIds, contactSelection, templateId }`
**Compile-live Response:** `{ jobId }`

**Compile-status Response:** `{ status: "queued"|"active"|"completed"|"failed", error? }`
**Compile-result Response:** Binary PDF blob (Content-Type: application/pdf)

### AI

| Method | Route | Purpose | Auth | Rate Limit |
|---|---|---|---|---|
| POST | `/api/protected/ai/generate-bullets` | Generate bullets from raw text | Yes | 10/hr |
| POST | `/api/protected/ai/expand-vault` | Expand brief → 12 bullets | Yes | 10/hr |
| POST | `/api/protected/ai/select-bullets` | Select best bullets for JD | Yes | 10/hr |

**Generate-bullets Request:** `{ section: "experience"|"projects"|"skills"|"summary"|"project"|"experience_entry", rawInput, context? }`
**Generate-bullets Response:** `{ bullets?, languages?, frameworks?, tools?, summary?, ... }`

**Expand-vault Request:** `{ type?: "PROJECT"|"EXPERIENCE", title, rawDescription, content?, count? }`
**Expand-vault Response:** `{ vaultBullets: VaultBullet[] }`

**Select-bullets Request:** `{ jobDescription }`
**Select-bullets Response:** `{ selectedExperienceIds, selectedProjectIds, selections, skills?, rationale }`

### Chat

| Method | Route | Purpose | Auth | Rate Limit |
|---|---|---|---|---|
| POST | `/api/protected/chat/interact` | Parse chat intent | Yes | 10/hr |
| POST | `/api/protected/chat/save` | Save chat message | Yes | 10/hr |
| GET | `/api/protected/chat/history` | Get chat history | Yes | 10/hr |
| DELETE | `/api/protected/chat/clear` | Clear chat history | Yes | 10/hr |

**Interact Request:** `{ messages: [{ role, content }], currentState?: { phase }, mode }`
**Interact Response:** `{ reply, intent, targetWidget, extractedData }`

**Save Request:** `{ role, content, widget?, mode }` (body validated via Zod)
**Save Response:** `ChatMessage`

**History Query:** `?mode=ONBOARDING|BUILDER|DASHBOARD|TAILOR|PROFILE`

### History (Tailored Resumes)

| Method | Route | Purpose | Auth |
|---|---|---|---|
| GET | `/api/protected/history` | List tailored resumes | Yes |
| GET | `/api/protected/history/:id` | Get specific tailored resume | Yes |
| DELETE | `/api/protected/history/:id` | Delete tailored resume | Yes |
| PATCH | `/api/protected/history/:id` | Update tailored resume | Yes |
| PUT | `/api/protected/history/:id/styling` | Update resume styling | Yes |

**History List Response:** `[{ id, companyName, jobTitle, createdAt }]`

### Rate Limiters

| Scope | Window | Limit |
|---|---|---|
| `/api/auth/*` | 1 min | 20 req/IP |
| `/api/protected/ai/*` | 1 hour | 10 req/user |
| `/api/protected/resume/tailor` | 1 hour | 10 req/user |
| `/api/protected/resume/parse` | 1 hour | 10 req/user |
| `/api/protected/chat/*` | 1 hour | 10 req/user |
| `/api/protected/resume/compile-live` | 1 min | 15 req/user |
| `/api/protected/profile/*` | 1 min | 100 req/user |
| `/api/protected/history/*` | 1 min | 100 req/user |

---

## 9. Database

### ER Diagram

```
┌──────────────────┐       ┌──────────────────┐
│      User        │       │    Session       │
│──────────────────│       │──────────────────│
│ id (PK)          │──1:N──│ id (PK)          │
│ email (UQ)       │       │ userId (FK)      │
│ emailVerified    │       │ token (UQ)       │
│ name             │       │ expiresAt        │
│ image?           │       │ ipAddress?       │
│ createdAt        │       │ userAgent?       │
│ updatedAt        │       └──────────────────┘
└──────────────────┘
       │ 1:1
       │
       ▼
┌──────────────────┐       ┌──────────────────┐
│     Profile      │       │     Account      │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ userId (FK,UQ)   │       │ userId (FK)      │
│ githubUsername?  │       │ accountId        │
│ rawResumeText?   │       │ providerId       │
│ contact (JSON)   │       │ accessToken?     │
│ education (JSON) │       │ refreshToken?    │
│ experience (JSON)│       │ ...              │
│ projects (JSON)  │       └──────────────────┘
│ skills (JSON)    │
│ certificates (J) │       ┌──────────────────┐
│ extracurriculars │       │  Verification    │
│ leadership (J)   │       │──────────────────│
│ achievements (J) │       │ id (PK)          │
│ createdAt        │       │ identifier       │
│ updatedAt        │       │ value            │
└──────────────────┘       │ expiresAt        │
                           └──────────────────┘
       │ 1:N
       │
       ▼
┌──────────────────┐       ┌──────────────────┐
│ TailoredResume   │       │  GitHubRepo      │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ userId (FK)      │       │ userId (FK)      │
│ companyName      │       │ repoName         │
│ jobTitle         │       │ repoUrl          │
│ jobDescription   │       │ techStack (JSON) │
│ tailoredData (J)│       │ bulletsGen (J)   │
│ styleConfig (J)?│       │ syncedAt         │
│ createdAt        │       │ UQ(userId, url)  │
└──────────────────┘       └──────────────────┘

┌──────────────────┐
│  ChatMessage     │
│──────────────────│
│ id (PK)          │
│ userId (FK)      │
│ role             │   // 'user' | 'assistant' | 'system'
│ content          │
│ widget?          │   // Widget type string
│ mode             │   // ONBOARDING | BUILDER | DASHBOARD | TAILOR | PROFILE
│ createdAt        │
└──────────────────┘
```

### Table Relationships

| Table | Foreign Key | Relation |
|---|---|---|
| `Session` | `userId → User.id` | N:1 |
| `Account` | `userId → User.id` | N:1 |
| `Profile` | `userId → User.id` | 1:1 (unique constraint on userId) |
| `TailoredResume` | `userId → User.id` | N:1 |
| `GitHubRepo` | `userId → User.id` | N:1 |
| `ChatMessage` | `userId → User.id` | N:1 |

### JSON Fields

| Table | JSON Columns | Schema |
|---|---|---|
| `Profile` | `contact`, `education`, `experience`, `projects`, `skills`, `certificates`, `extracurriculars`, `leadership`, `achievements` | Zod-validated in `backend/src/shared/index.ts` |
| `TailoredResume` | `tailoredData`, `styleConfig` | Varies (full tailored output) |
| `GitHubRepo` | `techStack`, `bulletsGenerated` | String arrays |

### Indexes

- Primary keys on all tables (`id`)
- Unique on `User.email`
- Unique on `Session.token`
- Unique on `Profile.userId`
- Unique on `GitHubRepo(userId, repoUrl)`
- No additional indexes detected (no `@@index` in Prisma schema)

### Potential Scaling Issues

1. **JSON column queries**: Profile sections stored as JSON cannot be queried by Prisma without raw SQL or `$expr`. Adding indexes on JSON fields requires PostgreSQL-specific syntax.
2. **ChatMessage unbounded growth**: No TTL, no cleanup, no pagination strategy. A heavy user could accumulate thousands of chat rows.
3. **TailoredResume tailoredData is large**: The `tailoredData` JSON column stores the full profile + tailored output + LaTeX source. This could grow large over time.
4. **No Profile versioning**: Each `PATCH` overwrites the entire Profile row. No history or rollback.
5. **No database-level cascade deletes on some relations**: All relations use `onDelete: Cascade` except those implicitly handled by Prisma's defaults.
6. **No connection pooling configuration detected**: The Prisma adapter uses `@prisma/adapter-pg` with direct `pg` client. No explicit pool configuration.

---

## 10. AI System

### AI Endpoints

| Endpoint | AI Role | Prompt | Output Schema | Fallback |
|---|---|---|---|---|
| `POST /chat/interact` | Intent classification + reply generation | `CHAT_INTENT_PARSER` (prompts/index.ts) | `chatInteractAISchema` (Zod) | Yes: "I didn't quite catch that" |
| `POST /resume/parse` | Extract structured data from raw text | `PARSE_RESUME` (prompts/index.ts) | `parsedResumeSchema` (Zod) | No — throws error |
| `POST /resume/tailor` | Select matching bullets + generate summary | `bulletSelectorPrompt(templateId)` + summary prompt | `bulletSelectionSchema` (Zod) + `{ summary }` | Summary has fallback, bullet selection doesn't |
| `POST /ai/generate-bullets` | Generate bullets per section | Section-specific prompts | Section-specific Zod schemas | No |
| `POST /ai/expand-vault` | Generate 12 bullets from brief | `VAULT_EXPANDER` (prompts/index.ts) | `vaultExpandAISchema` (Zod) | No |
| `POST /ai/select-bullets` | Select best bullets for JD | `bulletSelectorPrompt(templateId)` | `bulletSelectAISchema` (Zod) | No |

### Prompt Construction

**Chat Interact:**
```
System: {CHAT_INTENT_PARSER}
        \n\nThe user is currently in phase: {phase}.

User: {formatted conversation history}
[Optional: URL scraped content via Jina AI]
```

**Resume Tailor (bullet selection):**
```
System: {bulletSelectorPrompt(templateId)}
        \n\nCurrent date: {today}
        \n\nTemplate: {templateId}
        \nMax entries: {config}
        \nMax bullets per entry: {config}

User: {JSON.stringify({ jobDescription, profile: compactProfile })}
```

**Resume Tailor (summary):**
```
System: "You are a resume summary writer..."
User:   {JSON.stringify({ jobDescription, profile: compactProfile })}
```

**Resume Parse:**
```
System: {PARSE_RESUME}
User:   {raw pdf text}
```

### System Prompts

Four system prompts exist in `backend/src/infrastructure/prompts/index.ts`:

| Prompt | Lines | Length | Purpose |
|---|---|---|---|
| `PARSE_RESUME` | ~98 | Long | Extract structured resume from raw text. Forces specific JSON schema including contact, education, experience, projects, skills. |
| `CHAT_INTENT_PARSER` | ~63 | Long | Routing brain. Determines intent + target widget. Includes few-shot examples and URL scraping instructions. |
| `VAULT_EXPANDER` | ~60 | Long | Expert technical resume writer. Generates exactly 12 bullets per experience/project. Categorized by FRONTEND/BACKEND/DEVOPS/LEADERSHIP/GENERAL. |
| `BULLET_SELECTOR` | ~108 | Long | Resume strategist. Selects best 3-5 bullets per entry for a specific job description. Template-aware. |

### Output Schemas

All AI outputs are validated through **Zod schemas**:

```typescript
// Chat Interact
chatInteractAISchema = {
  intent: z.enum(["PROVIDE_DATA", "NAVIGATE", "GENERAL_CHAT", "GENERATE_PROFILE_DATA"]),
  targetWidget: z.enum([...]).nullable().default(null),
  reply: z.string(),
  extractedData: z.record(z.string(), z.unknown()).optional().default({}),
}

// Vault Expansion
vaultExpandAISchema = {
  vaultBullets: z.array({
    id: z.string(), text: z.string(),
    category: z.enum(["FRONTEND","BACKEND","DEVOPS","LEADERSHIP","GENERAL"]).optional(),
    keywords: z.array(z.string()).default([]),
    isAIGenerated: z.boolean().default(true),
  }),
}

// Bullet Selection
bulletSelectAISchema = {
  selectedExperienceIds: z.array(z.string()),
  selectedProjectIds: z.array(z.string()),
  selections: z.record(z.string(), z.array(z.string())),
  skills: z.object({...}).optional(),
  rationale: z.string(),
}

// Resume Parse
parsedResumeSchema = {
  contact: contactSchema,
  education: z.array(educationSchema),
  experience: z.array(experienceSchema.transform(...)),
  projects: z.array(projectSchema.transform(...)),
  skills: skillsSchema,
}
```

### Validation & Fallbacks

- Chat interact: Zod schema validates AI response. If validation fails, **fallback response** is returned (`GENERAL_CHAT`, null widget, "I didn't quite catch that").
- All other AI calls: If validation fails, error propagates to the caller (HTTP 500).
- URL scraping in chat: If Jina AI fetch fails, the URL is silently skipped (logged error, conversation continues without scraped content).
- AI service implementation: Uses `fetch` to call an OpenAI-compatible API with `response_format: { type: 'json_object' }`. If the API call itself fails, the error propagates.

### Rate Limits

All AI endpoints are rate-limited to **10 requests per hour per user** (configurable via the Redis-backed rate limiter). This is a hard limit enforced by middleware before the handler executes.

### Token Usage

Cannot be directly inferred from the code. The AI service implementation (`infrastructure/ai-service.ts`) uses `fetch` to an OpenAI-compatible API. No token counting, budgeting, or usage tracking is detectable.

### How AI Affects Frontend

The AI is the **decision engine** for the entire application:

1. **Navigation**: AI determines what widget/state to show next
2. **Data creation**: AI extracts profile data from unstructured input
3. **Content generation**: AI writes resume bullets and summaries
4. **Selection**: AI matches vault content to job descriptions
5. **Fallback**: If AI fails, the chat falls back to a generic response (no retry)

The frontend is **passive** — it renders what the AI decides. The only exception is the initial onboarding greeting (hardcoded in page.tsx).

---

## 11. State Management

### Store Overview

```
┌────────────────────────────────────────────────────────────┐
│                   Zustand Stores                            │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  useChatStore    │  │ useBuilderStore  │                 │
│  │                  │  │                  │                 │
│  │ messagesByMode   │  │ profile          │                 │
│  │ currentPhase     │  │ jobTitle/Company/│                 │
│  │ isTyping         │  │   JD             │                 │
│  │ mode             │  │ selectedBulletIds│                 │
│  │ extractedData    │  │ selectedExp/Prj/ │                 │
│  │                  │  │   Edu Ids        │                 │
│  │ addMessage()     │  │ contactSelection │                 │
│  │ sendMessage()    │  │ template         │                 │
│  │ loadHistory()    │  │ pdfUrl / zoom    │                 │
│  │ setPhase()       │  │ status/stage     │                 │
│  │ clearChat()      │  │                  │                 │
│  └────────┬─────────┘  │ setProfile()     │                 │
│           │            │ toggleBullet()   │                 │
│           │            │ triggerCompile() │                 │
│           │            └────────┬─────────┘                 │
│           │                     │                           │
│           └─────────┬───────────┘                           │
│                     │                                       │
│  ┌──────────────────▼──────────────────┐                    │
│  │         useProfileStore             │                    │
│  │                                      │                   │
│  │  profile (current + original)       │                   │
│  │  loading / saving state machine     │                   │
│  │                                      │                   │
│  │  loadProfile() / saveProfile()       │                   │
│  │  updateProfile()                    │                   │
│  │  addProject/Experience/Education()   │                   │
│  │  deleteProject/Experience/Cert()    │                   │
│  │  updateSkills/Contact()             │                   │
│  └──────────────────────────────────────┘                    │
│                                                             │
│  Ownership Boundaries:                                      │
│  ┌─────────────────────┬──────────────────────┐             │
│  │ Onboarding → Chat   │ Dashboard → Chat +   │             │
│  │ Builder → Builder   │   direct rendering   │             │
│  │ Profile → Profile   │ History → local      │             │
│  └─────────────────────┴──────────────────────┘             │
└────────────────────────────────────────────────────────────┘
```

### Store to Component Ownership

| Store | Owned By | Read By | Written By |
|---|---|---|---|
| `useChatStore` | Onboarding + Tailor pages | `ChatContainer`, `ChatInput`, `MessageBubble`, `DashboardChatClient`, `OnboardingPreviewPanel` | `ChatInput` (`sendMessage`), `ResumeUploadWidget` (`setState`), `DashboardChatClient` (`addMessage`), AI response handler |
| `useBuilderStore` | Tailor page | `LivePdfRenderer`, `Splitter`, selection widgets, sidebar | `TailorPage` (init), `toggle*` actions, `triggerCompile()` |
| `useProfileStore` | Profile page | Profile editor components | Profile editor components (all CRUD methods) |

### Store Communication

**ChatStore ↔ BuilderStore:**
- No direct communication. Both stores exist independently.
- The tailor page initializes the builder store from profile data and uses the chat store for the TAILOR mode conversation flow.
- Chat messages in TAILOR mode describe the builder state but don't control it.

**ChatStore ↔ ProfileStore:**
- No direct communication.
- During onboarding, extracted data flows from ChatStore → page useEffect → POST /api/protected/profile (not through ProfileStore).
- ProfileStore only manages the standalone /profile page.

### Duplication

1. **Profile data**: The `Profile` type is stored in `useBuilderStore.profile` and `useProfileStore.profile` independently. Changes in one are NOT reflected in the other.
2. **Chat messages**: The `DashboardChatClient` adds messages to `useChatStore` that duplicate information already rendered by server-side dashboard widgets.
3. **extractedData**: During onboarding, the parsed resume data is stored in `useChatStore.extractedData` and also used to POST to the profile endpoint. There's no single source of truth for "in-flight" profile data.

### Global vs Local

| State | Global? | Notes |
|---|---|---|
| Session | BetterAuth (external) | Stored in cookies, not Zustand |
| Chat messages | Per-mode store | Independent histories per mode |
| Builder state | Page-scoped | Only relevant on /tailor |
| Profile editor | Page-scoped | Only relevant on /profile |
| Theme | next-themes (React context) | Global |

### State Machine Patterns

**Profile Save State Machine:**
```
idle → saving → saved (2s) → idle
idle → saving → error (until next save)
```

**Builder Compile State Machine:**
```
idle → queued → compiling → ready
idle → queued → compiling → error
```

**Builder Stage State Machine:**
```
idle → collecting → generating → reviewing → compiling → ready
```

**Onboarding Phase State Machine (linear):**
```
GREETING → AWAITING_RESUME_OR_TEXT → PROCESSING_UPLOAD → 
REVIEW_EXPERIENCE → REVIEW_PROJECTS → REVIEW_SKILLS → 
REVIEW_CONTACT_AND_CERTS → COMPLETE
```

Note: The phase state machine is defined by the `OnboardingPhase` union type but most phase transitions rely on the AI returning specific `targetWidget` values. Not all phases are guaranteed to be visited.

---

## 12. UI System

### Component Library Strategy

Custom-built, proprietary. No external component library (shadcn/ui, MUI, Ant Design, etc.). All 19 primitive components are in `frontend/src/components/ui/`.

```
Component Tree:
├── Button        (5 variants, 4 sizes)
├── Input         (label, icon, error, helper text)
├── Textarea      (label, error, helper text)
├── Card          (+ Header, Title, Description, Content, Footer)
├── Badge         (5 variants, 2 sizes)
├── Dialog        (modal, 3 sizes, portal-based)
├── Progress      (3 sizes, label, value display)
├── Skeleton      (+ Text, Title, Card variants)
├── Separator     (horizontal/vertical)
├── Tooltip       (top-only, CSS-powered)
├── Avatar        (image + initials fallback, 3 sizes)
├── Field         (horizontal/vertical layout)
├── Splitter      (draggable panel divider)
├── BulletList    (editable bullet point list)
├── BorderGlow    (animated conic gradient border)
├── ChromaGrid    (GSAP-powered animated grid)
├── AnimatedList  (motion/react stagger animations)
├── OverleafButton (form POST to Overleaf)
└── SectionCard   (titled section wrapper)
```

### Design Tokens

Defined in `globals.css` as CSS custom properties:

```
Background Hierarchy:
  --bg: #09090b          (page background)
  --surface: #0c0c0e    (sidebar, secondary surfaces)
  --card: #141417       (card backgrounds)
  --muted: #1a1a1e      (muted backgrounds)

Text Hierarchy:
  --fg: #f2f2f4          (primary text)
  --fg-2: #e4e4e7        (secondary text)
  --muted-fg: #a1a1aa    (muted text)
  --meta: #71717a         (subdued text)

Border Hierarchy:
  --border: #27272b       (standard borders)
  --border-soft: #1e1e22  (subtle borders)

Brand / Accent:
  --accent: #16a34a        (primary green)
  --accent-hover: #15803d  (hover state)
  --accent-soft: rgba(22,163,74,0.12)
  --accent-glow: rgba(22,163,74,0.2)

Semantic:
  --success: #22c55e
  --warn: #f59e0b
  --danger: #ef4444

Radii:
  --radius-sm: 6px
  --radius-md: 10px
  --radius-lg: 14px
  --radius-xl: 20px
  --radius-2xl: 28px
  --radius-pill: 9999px
```

### Tailwind v4 Strategy

Tailwind v4 uses `@theme inline` to create semantic color tokens:

```css
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-content: var(--fg);
  --color-edge: var(--border);
  --color-brand: var(--accent);
  --color-success: var(--success);
  /* etc. */
}
```

Usage pattern: `bg-surface`, `text-content`, `border-edge`, `bg-brand`, `text-content-muted`

### Animations

**GSAP (GreenSock)**: Used for advanced animations in `ChromaGrid` component.
- Mouse-tracking spotlight effect on grid items
- Staggered scale + opacity entrance

**motion/react**: Used for `AnimatedList` component.
- Staggered fade-up on scroll into view
- `whileInView` + `variants` pattern

**CSS Keyframes** (in `globals.css`):
- `fade-up`: Opacity + translateY (the primary entrance animation)
- `float`: Floating background orbs
- `pulse-glow`: Pulsing dot indicator
- `ats-grow`: Progress bar fill
- `bounce-dot`: Typing indicator
- `shimmer`: Skeleton loading

**Animation utility classes:**
- `.animate-fade-up` through `.animate-fade-up-d4` (staggered baseline + 80ms increments)
- `.delay-75` through `.delay-300`
- `.card-lift` (hover: translateY(-4px) + brand glow shadow)

### Glass Effects

```css
.glass {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4);
}

.glass-heavy {
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.08);
}
```

Applied via utility class `.glass` directly in className strings.

### Responsive Strategy

- Tailwind's default breakpoints (`sm:`, `md:`, `lg:`)
- Landing: `sm:grid-cols-3` on navigation cards
- Onboarding: `lg:flex-row` on split panels
- Dashboard: `md:grid-cols-3` on stats grid
- Sidebar: fixed 240px on desktop, hidden on mobile (mobile menu via `MobileMenu` component)
- No custom breakpoints detected

### Dark Mode

- **Only dark mode tokens defined** in `:root`
- `next-themes` `ThemeProvider` configured with `defaultTheme="system"` and `enableSystem`
- `ThemeToggle` component switches between 'dark' and 'light'
- **Light mode would render incorrectly** — no light palette exists. Activating light mode would show dark backgrounds with no corresponding light-colored text.

### Layout Primitives

- **Sidebar**: Fixed width (240px expanded, 72px collapsed), sticky top, scrollable
- **AppLayout**: Flex container with sidebar + main content area
- **Split-screen**: Flex containers with `lg:flex-row` for desktop, column for mobile
- **Card grid**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pattern

---

## 13. Extensibility

### Chat System

| Aspect | Rating | Evidence |
|---|---|---|
| **Add new chat mode** | Easy | Add string to `ChatMode` union + add entry to `initialModeMessages` |
| **Add new widget** | Medium | Add widget component, add case in `MessageBubble` render switch, add to AI prompt's targetWidget enum |
| **Modify AI routing** | Hard | Prompt is hardcoded in `CHAT_INTENT_PARSER`. Requires redeploy. No per-user prompt customization. |
| **Add streaming** | Hard | No SSE/WebSocket infrastructure. Full rewrite of frontend sendMessage + backend parseIntent. |
| **Reuse chat outside pages** | Easy | `ChatContainer` accepts `mode` prop. Any component can embed it. |
| **Assumptions** | Full conversation history sent every time; AI decides widget; messages persist to DB |

### Profile / Vault

| Aspect | Rating | Evidence |
|---|---|---|
| **Add new section** | Easy | Add Zod schema in shared, Prisma JSON column already exists |
| **Add new field** | Easy | Expand Zod schema, no migration needed |
| **Change validation** | Medium | Shared schemas used by frontend + backend + AI prompts (must keep in sync) |
| **Add auto-save conflict detection** | Medium | Store overwrites blindly; would need timestamps or diffs |
| **Assumptions** | Single user edits profile at a time; JSON columns are acceptable; no querying needed |

### Builder / Tailor

| Aspect | Rating | Evidence |
|---|---|---|
| **Add new template** | Easy | Add .tex file + `TemplateConfig` entry + template ID to `compileLiveSchema` enum |
| **Change selection logic** | Easy | Pure toggle functions in store; no side effects |
| **Replace compile flow** | Medium | `triggerCompile()` is tightly coupled to polling flow + Redis + BullMQ |
| **Add incremental compilation** | Hard | Would require caching layer between selections and LaTeX generation |
| **Assumptions** | Full compile on every change; single job description at a time; user has exactly one profile |

### AI System

| Aspect | Rating | Evidence |
|---|---|---|
| **Add new AI endpoint** | Medium | Add Zod schema, use case method, route handler, prompt |
| **Modify prompt** | Medium | Requires backend redeploy; no runtime prompt management |
| **Switch AI provider** | Medium | `IAIService` interface abstracts provider; implementation uses OpenAI-compatible API |
| **Add retry logic** | Easy | Not implemented; could wrap `generateStructuredData` in retry loop |
| **Track token usage** | Medium | No tracking currently; would need middleware or wrapper around AI service |
| **Assumptions** | AI always returns valid JSON; 10 req/hr is sufficient; JSON mode supported by provider |

### Database

| Aspect | Rating | Evidence |
|---|---|---|
| **Add table** | Easy | Prisma schema change + migration |
| **Add column** | Easy | Prisma schema change + migration |
| **Change JSON column schema** | Easy | No migration needed (JSON is schema-less at DB level) |
| **Add indexes** | Easy | Prisma `@@index` annotation |
| **Migrate from JSON to relational** | Hard | Would require restructuring Profile model into separate tables |
| **Assumptions** | JSON columns for flexible storage; single DB instance; no sharding |

### Frontend Components

| Aspect | Rating | Evidence |
|---|---|---|
| **Add new UI primitive** | Easy | Follow existing pattern (Tailwind + forwardRef + variants) |
| **Change existing primitive** | Medium | Must check all usages for visual regressions |
| **Swap component library** | Very Hard | 30+ custom components across the app |
| **Add new page** | Medium | App Router convention; layout checks session + profile automatically |
| **Assumptions** | Dark mode only; glassmorphism aesthetic; green accent; JetBrains Mono for code |

---

## 14. Refactor Risk

### Risk Rating Scale

| Rating | Meaning |
|---|---|
| **Low** | Isolated, well-abstracted, easy to change without side effects |
| **Medium** | Some coupling, some shared state, moderate risk |
| **High** | Tight coupling, shared assumptions, significant risk |
| **Critical** | Core architecture assumption; changing would require substantial rewrite |

### Risk by Subsystem

| Subsystem | Risk | Rationale |
|---|---|---|
| **Zustand Store Layer** | **Medium** | Three independent stores with clear boundaries. Adding stores is low-risk. Merging stores would be high-risk. ChatStore's `sendMessage` is tightly coupled to the AI response lifecycle. |
| **Chat System** | **High** | Tightly coupled to AI routing, widget rendering, onboarding phase transitions, and profile creation. The `sendMessage` function encapsulates the entire AI interaction lifecycle. The widget system (MessageBubble → widget rendering via string switch) is hard-coupled. |
| **Onboarding Flow** | **Critical** | The onboarding page's `useEffect` that watches `currentPhase === 'COMPLETE'` is the *only* way profiles are created. This couples profile creation to the AI's ability to return `NAVIGATE`/`REVIEW`. Changing the onboarding flow would affect the entire auth → profile → dashboard pipeline. |
| **Profile Store Auto-Save** | **Low** | Self-contained in `useProfileStore`. The debounce, localStorage draft, and dirty checking are independent of all other stores. Safe to refactor. |
| **Builder Store** | **Medium** | The `triggerCompile` method encapsulates the full compile lifecycle (enqueue → poll → fetch). The compile state machine (`idle → queued → compiling → ready`) is a single-use workflow. Refactoring would require updating both the store and the `LivePdfRenderer`. |
| **AI Prompts** | **Medium** | Prompts are hardcoded strings. Changing prompts requires backend deployment. Prompt changes affect AI output quality which affects frontend behavior. Risk is in unpredictability of AI, not code structure. |
| **Backend Use Cases** | **Low** | Each use case is a class with a single responsibility. `ChatUseCases`, `ProfileUseCases`, `ResumeUseCases`, `AiUseCases`, `HistoryUseCases`, `GithubUseCases` — all independently instantiated via DI. |
| **Backend DI Container** | **Low** | Dependency injection is centralized in `di/container.ts`. Adding new dependencies is straightforward. The container uses getter-based lazy initialization. |
| **Backend Routes** | **Low** | Each route file exports a factory function (`createXRouter(container)`). Routes are thin — they parse requests, call use cases, return responses. |
| **UI Component Library** | **Low** | Each component is independent. Some components (Field.tsx, BulletList.tsx) use inconsistent CSS variable names, but this is cosmetic. |
| **Tailwind + CSS Tokens** | **Medium** | Design tokens are centralized in `globals.css`. However, components reference tokens directly in Tailwind className strings. Changing a token name would require finding all usages. |
| **Prisma Schema** | **Medium** | JSON columns provide flexibility but prevent type-safe queries. Adding relational tables would be safe; removing JSON columns would be high-risk. |
| **Rate Limiting** | **Low** | Redis-backed rate limiter middleware is generic and configurable. Easy to add/remove/modify rate limit rules. |
| **Auth (BetterAuth)** | **High** | BetterAuth is integrated at three levels: server config, frontend client, and Hono middleware. Changing auth provider would require touching all three. OAuth-only (no email/password) limits options. |

### Risk Summary

| Area | Risk | Count |
|---|---|---|
| Critical | 1 | Onboarding flow |
| High | 3 | Chat system, BetterAuth integration, (see above) |
| Medium | 5 | Store layer, builder compile, AI prompts, CSS tokens, Prisma JSON |
| Low | 5 | Profile store, use cases, DI, routes, UI components |

---

## 15. Product Redesign Readiness

> Answers based on code evidence only. No suggestions or recommendations.

### Can the frontend become chat-first?

The frontend **already is chat-first**. The onboarding page is entirely chat-driven. The dashboard injects chat messages. The tailor flow uses chat for JD input and selection widgets. The only non-chat pages are Profile (form-based editor) and History (list view).

### Can the sidebar be redesigned?

Yes. `Sidebar` is a single component in `components/layout/sidebar.tsx`. It receives `user` and `collapsed` props. Its nav items are defined as an array. The sign-out logic is inline. The sidebar is composited inside `AppLayout`. Redesigning would only affect that component and its parent layout.

### Can the dashboard disappear?

Yes. The dashboard (`/dashboard`) is just a page route. There's no global dependency on it. Auth redirect currently checks `/auth/redirect` and sends users there if they have a profile, but this could point anywhere. The sidebar nav links to `/dashboard` as "Home" — these would need updating.

### Can the vault become global?

The vault (profile data) is **already implicitly global** — it's fetched independently by:
- Dashboard (server-side: `GET /api/protected/profile`)
- Tailor (client-side: via RPC call)
- Profile page (client-side: via `useProfileStore.loadProfile()`)

Each consumer fetches independently. There's no shared cache. Making it truly global (one source of truth) would require refactoring these three fetches into a shared caching layer.

### Can chat become persistent?

Chat **already persists** to `ChatMessage` database table. Messages are saved fire-and-forget after each interaction. History is loaded on mount via `loadHistory()`. However, there's no cross-session continuity — each page load re-fetches and re-renders all messages. There's no unread count, no notification, no background sync.

### Can the builder become embedded?

The builder (tailoring flow) is **already embedded** in the `/tailor` page. Its logic lives in `useBuilderStore`. The store is scoped to the page and initializes when the page mounts. Embedding the builder in another page would require re-instantiating the store or sharing the existing instance.

### Can pages become workspaces?

The application already has mode-based isolation (ONBOARDING, BUILDER, DASHBOARD, TAILOR, PROFILE). Each mode has separate chat history. The sidebar provides persistent navigation. The "workspace" concept partially exists — each mode could be a workspace with its own state and history.

### Can navigation become contextual?

Navigation is currently **static** — the sidebar always shows the same links regardless of which page the user is on, except for active link highlighting. There's no contextual menu, no breadcrumb trail, no page-specific actions in the sidebar.

### Can AI become universal?

AI is **already universal** — it drives the chat interface, parses resumes, generates content, and selects bullets. The `IAIService` interface abstracts the provider. However, AI prompts are hardcoded and not dynamically configurable. Making AI "more universal" would require per-feature prompt injection, which doesn't exist.

---

## 16. File Map

### Frontend Entry Points

| File | Role |
|---|---|
| `frontend/src/app/layout.tsx` | Root layout (ThemeProvider, Toaster) |
| `frontend/src/proxy.ts` | Request middleware (redirects, session check) |
| `frontend/src/app/globals.css` | Design tokens, Tailwind, animations, glass utilities |
| `frontend/next.config.ts` | Next.js config (rewrites, images, Turbopack) |

### Frontend Pages

| File | Page |
|---|---|
| `frontend/src/app/page.tsx` | Landing page |
| `frontend/src/app/onboarding/page.tsx` | Onboarding flow |
| `frontend/src/app/dashboard/layout.tsx` | Dashboard layout (session + profile check) |
| `frontend/src/app/dashboard/page.tsx` | Dashboard overview |
| `frontend/src/app/dashboard/nav.tsx` | Dashboard navigation (mobile + desktop) |
| `frontend/src/app/dashboard/dashboard-chat-client.tsx` | Dashboard chat message injection |
| `frontend/src/app/dashboard/roles/page.tsx` | Saved roles (coming soon) |
| `frontend/src/app/dashboard/templates/page.tsx` | Templates (coming soon) |
| `frontend/src/app/dashboard/settings/page.tsx` | Settings (coming soon) |
| `frontend/src/app/dashboard/ats-score/page.tsx` | ATS score (coming soon) |
| `frontend/src/app/dashboard/analytics/page.tsx` | Analytics (coming soon) |
| `frontend/src/app/dashboard/resumes/page.tsx` | Resumes (coming soon) |
| `frontend/src/app/dashboard/profile/page.tsx` | Old profile redirect |
| `frontend/src/app/profile/layout.tsx` | Profile layout |
| `frontend/src/app/profile/page.tsx` | Career Vault editor |
| `frontend/src/app/tailor/layout.tsx` | Tailor layout |
| `frontend/src/app/tailor/page.tsx` | Tailor flow |
| `frontend/src/app/tailor/builder/layout.tsx` | Builder layout (likely unused/redirected) |
| `frontend/src/app/history/layout.tsx` | History layout |
| `frontend/src/app/history/page.tsx` | Tailoring history |
| `frontend/src/app/tips/page.tsx` | Tips |
| `frontend/src/app/access-denied/page.tsx` | Access denied |
| `frontend/src/app/auth/redirect/page.tsx` | OAuth redirect handler |

### Frontend Stores

| File | Store |
|---|---|
| `frontend/src/store/useChatStore.ts` | Chat messages, phases, modes, extracted data |
| `frontend/src/store/useBuilderStore.ts` | Builder/tailor state, selections, compile, PDF |
| `frontend/src/store/useProfileStore.ts` | Profile CRUD, auto-save, drafts |

### Frontend Config

| File | Purpose |
|---|---|
| `frontend/src/config/api-client.ts` | Hono RPC client (`hc`), fetch helper |
| `frontend/src/config/api-client-server.ts` | Server-side API client + `getServerSession`/`hasProfile` |
| `frontend/src/config/auth-client.ts` | BetterAuth browser client |

### Frontend Hooks

| File | Hook |
|---|---|
| `frontend/src/hooks/use-is-active.ts` | Route active state for sidebar nav links |

### Frontend Component Directories

| Directory | Contents |
|---|---|
| `frontend/src/components/ui/` | 19 primitive components |
| `frontend/src/components/chat/` | ChatContainer, ChatInput, MessageBubble |
| `frontend/src/components/chat/widgets/` | ResumeUploadWidget, Dashboard*Widgets, TailorInputWidget, selection widgets, LivePdfRenderer, OnboardingPreviewPanel, ProfileGeneratorWidget |
| `frontend/src/components/layout/` | AppLayout, Sidebar |
| `frontend/src/components/generate/` | (Generation-related components, not fully explored) |
| `frontend/src/components/profile/` | Profile editor components |

### Backend Entry Points

| File | Role |
|---|---|
| `backend/src/index.ts` | Server entry, Hono app, middleware, routes |
| `backend/src/env-init.ts` | Load .env.development + .env |

### Backend Routes

| File | Exports |
|---|---|
| `backend/src/interface/routes/chat.ts` | `createChatRouter` → `/interact`, `/save`, `/history`, `/clear` |
| `backend/src/interface/routes/profile.ts` | `createProfileRouter` → GET, POST, PATCH `/` |
| `backend/src/interface/routes/resume.ts` | `createResumeRouter` → `/parse`, `/tailor`, `/compile-live`, `/compile-status/:jobId`, `/compile-result/:jobId` |
| `backend/src/interface/routes/ai.ts` | `createAiRouter` → `/generate-bullets`, `/expand-vault`, `/select-bullets` |
| `backend/src/interface/routes/history.ts` | `createHistoryRouter` → GET, GET/:id, DELETE/:id, PATCH/:id, PUT/:id/styling |

### Backend Use Cases

| File | Class |
|---|---|
| `backend/src/core/application/use-cases/chat-use-cases.ts` | `ChatUseCases` (parseIntent, expandVault, selectBullets) |
| `backend/src/core/application/use-cases/profile-use-cases.ts` | `ProfileUseCases` (getProfile, updateProfile, saveFromOnboarding) |
| `backend/src/core/application/use-cases/resume-use-cases.ts` | `ResumeUseCases` (parseResume, tailorResume) |
| `backend/src/core/application/use-cases/ai-use-cases.ts` | `AiUseCases` (generate) |
| `backend/src/core/application/use-cases/history-use-cases.ts` | `HistoryUseCases` (list, get, delete, updateStyling) |
| `backend/src/core/application/use-cases/github-use-cases.ts` | `GithubUseCases` (importRepos) |

### Backend Infrastructure

| File | Role |
|---|---|
| `backend/src/infrastructure/prompts/index.ts` | All AI system prompts (CHAT_INTENT_PARSER, PARSE_RESUME, VAULT_EXPANDER, BULLET_SELECTOR) |
| `backend/src/infrastructure/queue/pdf-queue.ts` | BullMQ queue setup |
| `backend/src/infrastructure/queue/pdf-worker.ts` | BullMQ worker (runs pdflatex) |
| `backend/src/infrastructure/queue/redis.ts` | Redis client |
| `backend/src/infrastructure/rate-limiter.ts` | Redis-backed rate limiter middleware |
| `backend/src/infrastructure/logger.ts` | Pino logger |
| `backend/src/infrastructure/ai-service.ts` | OpenAI-compatible AI service implementation |
| `backend/src/infrastructure/latex/latex-template.ts` | LaTeX template engine |
| `backend/src/infrastructure/latex/templates/` | LaTeX template files |
| `backend/src/infrastructure/profile-utils.ts` | Profile completeness calculation |

### Backend DI

| File | Role |
|---|---|
| `backend/src/di/container.ts` | Dependency injection container (lazy-initialized singletons) |

### Backend Config + Schema

| File | Role |
|---|---|
| `backend/src/config/auth.ts` | BetterAuth server configuration |
| `backend/src/interface/types.ts` | Hono Variables type (session) |
| `backend/src/interface/schemas/compile-live.ts` | Compile-live request validation schema |
| `backend/prisma/schema.prisma` | Database schema |
| `backend/src/shared/index.ts` | Shared domain types + Zod schemas (`@resumint/shared`) |

---

## 17. Executive Summary

### Current Strengths

1. **Clean separation of concerns**: The backend follows a clean architecture pattern (routes → use cases → ports → infrastructure) with dependency injection. Each layer has a single responsibility.

2. **Type safety end-to-end**: Hono RPC client provides type-safe API calls from frontend to backend. Shared Zod schemas in `@resumint/shared` validate both AI output and API requests.

3. **Flexible data model**: JSON columns in the Profile table allow adding new resume sections without database migrations. This is appropriate for a domain where the schema evolves frequently.

4. **Well-abstracted AI layer**: The `IAIService` interface decouples AI logic from business logic. Switching AI providers requires only a new implementation of one interface.

5. **Good state isolation**: Three Zustand stores with clear ownership boundaries. The chat store doesn't know about the builder store, and vice versa. The profile store is completely independent.

6. **Custom component library**: No dependency on external UI frameworks. All components follow consistent patterns (forwardRef, variant/size props, className merging).

7. **Comprehensive test suite**: 164 backend tests across 18 test files. Vitest with good coverage of use cases, routes, infrastructure.

### Weaknesses

1. **Onboarding is a single point of failure**: The entire user acquisition funnel depends on a single `useEffect` watching `currentPhase === 'COMPLETE'`. If the AI returns the wrong intent, the profile is never created and the user is stuck.

2. **Chat history grows unbounded**: `ChatMessage` table has no cleanup, no TTL, no pagination. Every request sends the full conversation history to the AI. This will cause token limit issues and database bloat.

3. **JSON columns prevent querying**: Profile data stored as JSON cannot be efficiently queried or indexed. Any future feature requiring "find all users with skill X" or "users who worked at company Y" would require PostgreSQL JSON path queries or a schema migration.

4. **AI prompts are hardcoded**: The four system prompts are static strings bundled in the backend. They cannot be modified without redeployment. No A/B testing, no per-user customization, no versioning.

5. **No streaming anywhere**: All AI interactions are request/response. No streaming, no SSE, no WebSocket. Users wait for full AI responses before seeing any output.

6. **Light theme is broken**: `next-themes` and `ThemeToggle` exist, but only dark mode tokens are defined. Light mode renders incorrectly.

7. **Dashboard ATS score is fake**: The ATS score widget displays a hardcoded 82% with animation. No actual scoring logic exists.

8. **Profile auto-save overwrites blindly**: The `PATCH /api/protected/profile` sends the entire profile object. There's no conflict detection — if two tabs are open, the last save wins.

9. **No message editing or deletion**: Chat messages cannot be edited or deleted by the user. The only way to clear is the `/clear` endpoint (programmatic, not exposed in UI).

10. **"Coming Soon" pages are dead code**: 6 dashboard sub-pages exist as functional components but are unreachable from the UI and marked "Coming soon".

### Flexibility

| Area | Flexibility | Notes |
|---|---|---|
| Adding new features | **High** | Monorepo structure, clean interfaces, DI container |
| Modifying AI behavior | **Medium** | Prompt changes require deploy, but AI service is swappable |
| Changing data model | **Medium** | JSON columns are flexible but support is limited |
| Restyling | **Medium** | Centralized tokens but components use inline className strings |
| Adding auth methods | **Low** | BetterAuth supports multiple providers but only Google is configured |
| Adding templates | **High** | Add .tex file + config entry |
| Migrating database | **Low** | JSON → relational would be a major migration |

### Technical Constraints

1. **AI rate limit of 10 req/hour** is the primary constraint on user activity. Each chat interaction, resume parse, tailor, bullet generation, and vault expansion counts against this limit.
2. **PDF compilation requires LaTeX in Docker** — the `pdflatex` binary must be available in the runtime environment. This adds ~2GB to the Docker image.
3. **Redis is required** for BullMQ queue and rate limiting. No Redis → no PDF compilation, no rate limiting.
4. **OpenAI-compatible API required** — the AI service expects `response_format: { type: 'json_object' }`. Not all providers support this.
5. **36-second compile timeout** — if PDF compilation takes longer than 36 seconds, the frontend gives up. Large resumes may hit this limit.
6. **5MB PDF file upload limit** enforced both in frontend (before upload) and backend.

### Architectural Opportunities

1. **Chat as a universal shell**: The chat system already handles onboarding, dashboard, and tailor flows. Extending it to cover profile editing and history would create a fully chat-driven application.

2. **Workspace isolation**: The mode-based chat system (ONBOARDING, BUILDER, DASHBOARD, TAILOR, PROFILE) provides natural workspace boundaries. Each mode could become a self-contained workspace with its own state, history, and AI context.

3. **Component library extraction**: The 19 custom UI primitives are independent of business logic. They could be extracted into a separate package for reuse across projects.

4. **Streaming AI**: The current request/response AI pattern is the biggest UX bottleneck. Adding SSE or WebSocket support would dramatically improve perceived performance.

5. **Profile-as-a-service**: The profile/vault is a self-contained subsystem with its own store, API, and data model. It could be extracted as an independent service.

### Unknowns (Cannot Be Inferred From Code)

- Whether the "Coming Soon" pages have planned implementations or are placeholders
- How the `/tips` page content is expected to work
- Whether light mode was intentionally incomplete or is in development
- What the `leadership` and `achievements` JSON fields in the Profile model are intended for (no UI or use case references them)
- Whether the `BUILDER` chat mode is actively used (it exists in types but `/tailor/builder` is redirected)
- Whether there are plans for a mobile app or native experience (no mobile-specific code detected)
- The AI provider/model being used (OpenCode Zen, OpenAI GPT-4, or other — only the base URL `https://api.opencode.ai/v1` is configurable)
- Real-world AI response times and failure rates
- Whether the 10 req/hour rate limit is sufficient for typical usage patterns
- Whether there are any background jobs or cron tasks beyond the PDF worker
