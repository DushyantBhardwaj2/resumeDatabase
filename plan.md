# Resumint — MVP Implementation Plan

## Tech Stack (Current)

| Layer | Choice |
|-------|--------|
| **Frontend** | Next.js 16.2.9 (App Router, Turbopack), TypeScript, Tailwind CSS v4 |
| **Backend** | Express + tsx on Render (`server/`) |
| **Auth** | Better Auth v1.6 (Google OAuth, `@nsut.ac.in` domain restriction, `nextCookies` plugin) |
| **Database** | Supabase PostgreSQL via Prisma v7 ORM + `@prisma/adapter-pg` |
| **AI** | Direct `fetch` to OpenCode Zen (`https://opencode.ai/zen/v1`) — Model: `deepseek-v4-flash-free` |
| **PDF Parsing** | `pdf-parse` v2 (text extraction) → OpenCode Zen AI (structured JSON extraction) |
| **Icons** | `@phosphor-icons/react` |
| **Testing** | Vitest 4 + jsdom + React Testing Library |
| **Hosting** | Vercel (frontend) + Render (backend) |

---

## Architecture Overview

```
User Browser
    │
    ├── Vercel (Next.js 16 — Frontend + Auth routes)
    │       │
    │       ├── AppLayout (Sidebar 228px + MobileNav drawer)
    │       ├── Better Auth locally at /api/auth/* (same-domain cookies)
    │       ├── Dashboard: Home, Profile, History, Tailor
    │       ├── Coming Soon: Resumes, Roles, Templates, ATS Score, Analytics, Settings
    │       └── 15 UI components (Button, Input, Card, Badge, Avatar, Dialog, etc.)
    │
    ├── Render (Express — Backend API via /api/protected/*)
    │       ├── Clean Architecture: domain → application → infrastructure
    │       ├── LaTeX compilation (pdflatex)
    │       └── Shared core layer (entities, use-cases, ports, persistence)
    │
    ├── Supabase PostgreSQL (via Prisma v7)
    └── GitHub API (repo fetch, import)
```

Vercel proxies `/api/*` to Render via `vercel.json` rewrites. Auth is handled **directly on Vercel** via Better Auth route handler (`src/app/api/auth/[...all]/route.ts`). This keeps session cookies on the same domain, eliminating cross-domain cookie issues.

---

## Database Schema (Prisma v7)

### `User`
| Column | Type | Notes |
|--------|------|-------|
| id | String (UUID) | PK, default |
| email | String | Unique, from Google OAuth |
| name | String | From Google OAuth |
| avatarUrl | String? | From Google OAuth |
| emailVerified | Boolean | Better Auth managed |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### `Profile` (1-to-1 with User)
| Column | Type | Notes |
|--------|------|-------|
| id | String (UUID) | PK |
| userId | String (UUID) | FK → User, unique |
| githubUsername | String? | For Phase 2 integration |
| rawResumeText | String? | Raw extracted PDF text |
| contact | Json? | `{phone, linkedin, github, portfolio}` |
| education | Json? | `[{school, degree, gpa, startYear, endYear}]` |
| experience | Json? | `[{company, role, startDate, endDate, bullets}]` |
| projects | Json? | `[{title, techStack, bullets, url}]` |
| skills | Json? | `{languages, frameworks, tools}` |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### `GitHubRepo` (Phase 2)
| Column | Type | Notes |
|--------|------|-------|
| id | String (UUID) | PK |
| userId | String (UUID) | FK → User |
| repoName | String | |
| repoUrl | String | |
| techStack | Json? | Languages/tags detected |
| bulletsGenerated | Json? | AI-generated bullet points |
| syncedAt | DateTime | |

### `TailoredResume` (Phase 3+4)
| Column | Type | Notes |
|--------|------|-------|
| id | String (UUID) | PK |
| userId | String (UUID) | FK → User |
| companyName | String | |
| jobTitle | String | |
| jobDescription | Text | Raw JD text |
| tailoredData | Json | Full tailored resume snapshot |
| styleConfig | Json? | `{template, accentColor, fontFamily, ...}` |
| createdAt | DateTime | Auto |

---

## Folder Structure

```
resumemint/
├── backend/                            # Hono backend (deployed on Render)
│   ├── src/
│   │   ├── index.ts                   # Hono server, CORS, session middleware
│   │   ├── routes/                    # API route handlers
│   │   ├── core/                      # Domain + application layers
│   │   ├── infrastructure/            # AI, PDF, LaTeX, persistence
│   │   ├── config/                    # Auth client/server config
│   │   └── di/                        # Dependency injection
│   ├── Dockerfile
│   └── package.json
├── server/                            # Alternative Express backend
│   ├── src/
│   │   ├── index.ts                   # Express server
│   │   ├── middleware/                # Auth middleware
│   │   └── routes/                    # API route handlers
│   ├── Dockerfile
│   └── package.json
├── prisma/
│   ├── schema.prisma                  # 7 models (no datasource.url)
│   └── prisma.config.ts               # v7 datasource URL config
├── docs/
│   ├── ui_design.md                   # Design system spec
│   └── data_saving_planning.md        # Data philosophy + AI component spec
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout: Satoshi, Inter, JetBrains Mono
│   │   ├── page.tsx                   # Landing page with Google Sign-In
│   │   ├── globals.css                # Tailwind v4 + design tokens + animations
│   │   ├── access-denied/
│   │   │   └── page.tsx               # NSUT-only restriction page
│   │   ├── onboarding/
│   │   │   └── page.tsx               # Multi-step wizard
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             # AppLayout wrapper
│   │   │   ├── page.tsx               # Dashboard home
│   │   │   ├── profile/page.tsx       # Profile editor
│   │   │   ├── resumes/page.tsx       # (coming soon)
│   │   │   ├── roles/page.tsx         # (coming soon)
│   │   │   ├── templates/page.tsx     # (coming soon)
│   │   │   ├── ats-score/page.tsx     # (coming soon)
│   │   │   ├── analytics/page.tsx     # (coming soon)
│   │   │   └── settings/page.tsx      # (coming soon)
│   │   ├── auth/redirect/page.tsx     # OAuth redirect handler
│   │   ├── tailor/
│   │   │   └── page.tsx               # Resume tailoring interface
│   │   ├── history/
│   │   │   └── page.tsx               # History dashboard
│   │   └── api/
│   │       └── auth/[...all]/route.ts # Better Auth API handlers
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-layout.tsx         # Sidebar + mobile nav + main
│   │   │   ├── sidebar.tsx            # Desktop fixed sidebar (228px)
│   │   │   ├── mobile-nav.tsx         # Mobile header + slide-in drawer
│   │   │   └── auth-layout.tsx        # Two-column auth page layout
│   │   ├── ui/
│   │   │   ├── button.tsx             # 4 variants, 3 sizes
│   │   │   ├── input.tsx              # Input + Textarea with label/error
│   │   │   ├── badge.tsx              # 6 color variants
│   │   │   ├── card.tsx               # 3 variants, 4 padding options
│   │   │   ├── avatar.tsx             # Image + initials fallback
│   │   │   ├── dialog.tsx             # Modal overlay
│   │   │   ├── progress.tsx           # Progress bar
│   │   │   ├── separator.tsx          # Horizontal divider
│   │   │   ├── skeleton.tsx           # Loading placeholder
│   │   │   ├── textarea.tsx           # Textarea with label/error
│   │   │   ├── tooltip.tsx            # CSS hover tooltip
│   │   │   ├── field.tsx              # Shared field wrapper
│   │   │   ├── section-card.tsx       # Section card layout
│   │   │   ├── bullet-list.tsx        # Editable bullet list
│   │   │   └── overleaf-button.tsx    # Overleaf export
│   │   ├── sign-in-button.tsx         # Reusable sign-in (default + minimal)
│   │   ├── theme-toggle.tsx           # Dark/light toggle
│   │   └── ai-assisted-content.tsx    # Universal AI content component
│   ├── lib/
│   │   ├── auth.ts                    # Server-side session fetch
│   │   ├── auth-client.ts             # Better Auth React client
│   │   ├── fetch.ts                   # Cookie-forwarding fetch
│   │   ├── utils.ts                   # cn, formatDate, getInitials, clamp, truncate
│   │   ├── profile-utils.ts           # Profile completeness scoring
│   │   ├── latex-template.ts          # LaTeX resume template filler
│   │   └── config/                    # Shared config (prisma, etc.)
│   └── config/
│       ├── auth.ts                    # Better Auth server config
│       └── auth-client.ts             # Better Auth client config
├── tests/
│   ├── sign-in-button.test.tsx        # Component test
│   ├── auth-redirect.test.ts          # Redirect logic test
│   └── auth-flow.test.ts              # Auth config contract test
├── vitest.config.ts
├── vitest.setup.ts
├── render.yaml                        # Render deployment config
├── vercel.json                        # Vercel deployment config
├── .env.example
├── tsconfig.json
├── next.config.ts
├── package.json
├── plan.md
└── development_log.md
```

---

## API Design

> All authenticated routes are under `/api/protected/*` on the Render backend. The Vercel frontend proxies `/api/*` to Render. Auth routes (`/api/auth/*`) are handled locally on Vercel.

| Method | Route (proxy) | Backend Route | Purpose |
|--------|------|------|---------|
| * | `/api/auth/*` | — (local on Vercel) | Better Auth handlers (login, callback, session, logout) |
| POST | `/api/protected/resume/parse` | `POST /api/protected/resume/parse` | Upload PDF → extract text → AI → structured JSON |
| GET | `/api/protected/profile` | `GET /api/protected/profile` | Fetch user's full profile |
| POST | `/api/protected/profile` | `POST /api/protected/profile` | Save profile upsert |
| PUT | `/api/protected/profile` | `PUT /api/protected/profile` | Update profile sections |
| GET | `/api/protected/integrations/github/repos` | `GET /api/protected/integrations/github/repos` | Fetch public repos by username |
| POST | `/api/protected/profile/projects/github-import` | `POST /api/protected/profile/projects/github-import` | Import selected repos as projects |
| POST | `/api/protected/resume/tailor` | `POST /api/protected/resume/tailor` | JD + profile → AI tailoring → tailored JSON |
| POST | `/api/protected/resume/compile` | `POST /api/protected/resume/compile` | LaTeX compile → PDF download |
| GET | `/api/protected/history` | `GET /api/history` | List all tailored resumes |
| GET | `/api/protected/history/[id]` | `GET /api/history/[id]` | Fetch single historical resume |
| DELETE | `/api/protected/history/[id]` | `DELETE /api/history/[id]` | Delete a historical resume |
| PUT | `/api/protected/history/[id]/styling` | `PUT /api/history/[id]/styling` | Update style config for a resume |
| POST | `/api/protected/ai/generate-bullets` | `POST /api/ai/generate-bullets` | AI bullet generation from raw text |
| GET | `/api/health` | `GET /api/health` | Health check (no auth) |

---

## Sequential Development Steps

### Phase 1: Authentication & Cold Start (Resume Parsing)

**Step 1.1 — Project Initialization** ✅
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- Install Prisma v7 + `@prisma/adapter-pg` (NOT `@prisma/client` directly — v7 breaking change)
- Install Better Auth + `@better-auth/prisma-adapter`
- Install `ai` + `@ai-sdk/openai` (Vercel AI SDK, currently unused — see Known Issues)
- Install `pdf-parse` v2 (uses `new PDFParse({data: buffer}).getText()` API)
- Set up `prisma/schema.prisma` — **no `datasource.url`** (Prisma v7 moves this to `prisma.config.ts`)
- `prisma.config.ts` with `datasourceUrl` from env
- Run `prisma db push` to sync schema to Supabase
- Configure `.env.local` with Supabase URL, Google OAuth credentials, OpenCode Zen API key

**Step 1.2 — Authentication (Better Auth + Google OAuth)** ✅
- Better Auth with Prisma adapter, Google OAuth social provider
- Domain restriction via `databaseHooks.user.create.before` — throws for non-`@nsut.ac.in`
- API route handler at `src/app/api/auth/[...all]/route.ts` using `toNextJsHandler` (import from `better-auth/integrations/next-js`)
- Auth client (`createAuthClient`) and `getServerSession` helper
- Access-denied screen for rejected emails
- Google redirect URI: `http://localhost:3000/api/auth/callback/google`

**Step 1.3 — Landing Page** ✅
- Hero section with branding, tagline, "Sign in with Google" CTA
- Responsive layout with Tailwind
- Feature cards (Parse & Import, Build Your Profile, Tailor Instantly)

**Step 1.4 — Onboarding: Resume Upload & Parsing** ✅
- Drag-and-drop PDF upload zone (file type + size validation, max 5MB)
- Upload → `POST /api/resume/parse`:
  1. Extract raw text via `pdf-parse` v2 (`new PDFParse({data: buffer}).getText()`)
  2. Send text to OpenCode Zen via raw `fetch` with structured JSON prompt
  3. Parse AI response text → extract JSON via regex → validate with Zod
  4. Return structured JSON to client
- Three-step UI: upload → parsing animation → editable review form
- "Save Profile" → `POST /api/profile/save` → upsert to database

**Step 1.5 — Error Handling & Polish** ✅
- try-catch wrappers on all API routes (return JSON 500 instead of Next.js HTML error page)
- Client-side error handling: parse JSON first, check status second
- Proper error messages displayed in UI

### Phase 2: Profile Dashboard & GitHub Integration ✅

**Objective**: Build the main dashboard where users manage/edit all profile sections, integrate GitHub to import repos as projects, and display a profile completeness score.

**Existing code to build on**:
- `src/app/dashboard/page.tsx` — basic server component, session check, sign-out, placeholder cards
- `src/app/onboarding/page.tsx` — client component, types `ParsedResume` (contact, education, experience, projects, skills), `handleSave` to `POST /api/profile/save`
- `src/app/api/profile/save/route.ts` — upserts profile with `parsedResumeSchema` validation
- `prisma/schema.prisma` — `Profile`, `GitHubRepo` models already defined
- `src/lib/pdf-parser.ts` — `parsedResumeSchema` = Zod shape and `ParsedResume` type
- `src/lib/ai.ts` — `generateStructuredData` for AI calls (will reuse for README summarization)

---

#### Step 2.1 — Dashboard Layout & Navigation (F2.1.1, F2.1.3, F2.1.4)

**What to build**:
1. **`src/app/dashboard/layout.tsx`** — Shared server layout with:
   - Navigation sidebar on desktop (collapsible on mobile) with links:
     - Dashboard (active = `/dashboard`)
     - My Profile (`/dashboard/profile`)
     - Tailor Resume (`/tailor` — disabled, Phase 3)
     - History (`/history` — disabled, Phase 4)
   - Sign-out button
   - User avatar/name from session
   - `<Toaster>` already in root layout (from Phase 1)
2. **`src/app/dashboard/page.tsx`** — Redesign as tabbed overview:
   - Profile completeness score card (greeting + progress bar)
   - Summary cards for each section (Education count, Experience count, Projects count, Skills count)
   - Quick-action buttons: "Edit Profile" → `/dashboard/profile`, "Tailor Resume" → `/tailor`
3. **`src/app/dashboard/profile/page.tsx`** — Tabbed profile editor (placeholder, built in Step 2.3)

**Key files created**: `src/app/dashboard/layout.tsx`, `src/app/dashboard/profile/page.tsx`

---

#### Step 2.2 — Profile API Endpoints (F2.4.2, F2.4.3)

**What to build**:
1. **`GET /api/profile`** — `src/app/api/profile/route.ts` (server):
   - Get session, fetch profile from DB by `userId`
   - Return full profile JSON (contact, education, experience, projects, skills, githubUsername)
   - 401 if unauthenticated, 404 if no profile yet
2. **`PUT /api/profile`** — `src/app/api/profile/route.ts` (same file, export PUT):
   - Accept partial updates per section (e.g. `{ contact: {...} }` or `{ experience: [...] }`)
   - Validate with Zod (reuse `parsedResumeSchema` from `pdf-parser.ts`)
   - Upsert profile, return updated profile
   - 401 if unauthenticated

**Files**: `src/app/api/profile/route.ts` (GET + PUT)

---

#### Step 2.3 — Profile Editing Interface (F2.2.1–F2.2.8)

**What to build**:
1. **`src/app/dashboard/profile/page.tsx`** — Full client-side profile editor:
   - Fetch profile via `GET /api/profile` on mount
   - Tabbed or accordion sections: Contact, Education, Experience, Projects, Skills
   - **Contact**: editable fields for phone, LinkedIn, GitHub, portfolio URLs
   - **Education**: list of entries with add/remove; each entry: school, degree, GPA, start/end year
   - **Experience**: list with add/remove; each entry: company, role, dates, bullet points (editable list with add/remove bullet)
   - **Projects**: list with add/remove; each entry: title, tech stack (comma-separated tags), bullet points, URL
   - **Skills**: categorized chip lists (languages, frameworks, tools) with add/remove
   - Drag-and-drop reordering for Experience and Projects (HTML5 drag-and-drop or a lightweight library)
   - "Save Changes" button → `PUT /api/profile` → `toast.success` / `toast.error`
   - Loading state while fetching/saving
2. **Helper components in `src/components/`**:
   - `EditableField` — label + input with consistent styling
   - `SectionCard` — collapsible card wrapper for each section
   - `BulletList` — editable list of bullet points
   - `ChipInput` — tag-style input for skills
   - `DraggableList` — drag-and-drop reorderable list

**Key insight**: Reuse `ParsedResume` type from `@/lib/pdf-parser` for type consistency across onboarding and dashboard.

---

#### Step 2.4 — Profile Completeness Score (F2.1.2)

**What to build**:
1. Scoring logic (utility function or inline in the dashboard page):
   - Total possible fields across all sections
   - Count filled fields (non-null, non-empty arrays)
   - Score = filled / total * 100
   - Example: contact has 4 fields, education entries each have 5 fields, etc.
2. Visual progress bar in the dashboard header
   - Color-coded: < 40% red, 40–70% yellow, > 70% green
   - Short encouragement text based on score
3. Include in both dashboard overview and profile editor

---

#### Step 2.5 — GitHub Integration: Backend (F2.4.1, F2.4.4, F2.4.5, F2.3.7)

**Existing**: `GitHubRepo` model already in `prisma/schema.prisma` with fields: id, userId, repoName, repoUrl, techStack, bulletsGenerated, syncedAt.

**What to build**:
1. **Store GitHub username** — Add `github_username` save to `PUT /api/profile` (field already in schema)
2. **`GET /api/integrations/github/repos?username={username}`** — `src/app/api/integrations/github/repos/route.ts`:
   - Fetch `https://api.github.com/users/{username}/repos?per_page=100&sort=updated`
   - Return filtered list: name, description, html_url, language, stargazers_count
   - Handle errors: user not found, rate limit, network failure
3. **`POST /api/profile/projects/github-import`** — `src/app/api/profile/projects/github-import/route.ts`:
   - Accept `{ repoUrls: string[] }`
   - For each repo, fetch its details if not already cached in `github_repos`
   - Use `generateStructuredData` to summarize README into 2-3 resume bullet points
   - Store in `github_repos` table and also merge into profile's `projects` JSONB
   - Return updated profile

---

#### Step 2.6 — GitHub Integration: Frontend (F2.3.1–F2.3.8)

**What to build**:
1. **"Integrations" tab in profile page** — section for GitHub:
   - Text input for GitHub username + "Connect" button
   - On connect: save username to profile, fetch repos
2. **Repo browser** — cards/list showing:
   - Repo name, description, primary language (with dot), stars count
   - Checkbox to select repos for import
   - "Import Selected" button
3. **Import flow**:
   - POST selected repos → backend summarizes + stores
   - Toast on success/failure
   - Refresh profile projects list
4. **"Re-sync" button** — re-fetches repos and updates imported data
5. **Loading states** for each API call

---

#### Step 2.7 — Verification & Polish

1. Run `tsc --noEmit` — fix any type errors
2. Run `npm run lint` — fix warnings
3. Update `docs/feature_checklist.md` — mark all 21 Phase 2 features `[x]`
4. Update `development_log.md` with Phase 2 entry
5. Update `plan.md` Phase 2 status to ✅

---

**Feature mapping to steps**:

| Step | Features |
|------|----------|
| 2.1 | F2.1.1, F2.1.3, F2.1.4 |
| 2.2 | F2.4.2, F2.4.3 |
| 2.3 | F2.2.1–F2.2.8 |
| 2.4 | F2.1.2 |
| 2.5 | F2.4.1, F2.4.4, F2.4.5, F2.3.7 |
| 2.6 | F2.3.1–F2.3.6, F2.3.8 |

### Phase 3: Resume Tailoring & AI Generation ✅

### Phase 4: History, Templates & Polish ✅

### Phase 5: Design System & AI-Assisted Content Creation ✅

**Status**: 37/38 features complete (1 deferred — F5.3.9 persisted wizard progress)

#### Step 5.1 — Design System Foundation ✅
- Updated `globals.css` with expanded Tailwind v4 tokens (primary-light, accent-dark/light, warning, radius scale)
- Satoshi headings (Fontshare CDN) + Inter body (`next/font/google`) + JetBrains Mono (fontsource)
- Created base components: `Button`, `Input`/`Textarea`, `Badge`, `Card` in `src/components/ui/`
- Created `docs/ui_design.md` and `docs/data_saving_planning.md`
- `tsc --noEmit` + `npm run build` pass cleanly

#### Step 5.2 — Universal AI Component ✅
- `POST /api/ai/generate-bullets` endpoint — accepts `{section, rawInput, context}`, returns structured bullets/skills/summary via OpenCode Zen
- `AIAssistedContent` component — 3 modes: AI generation with checkbox selection, manual input, hybrid edit
- Works for experience (bullet points), projects (bullet points), skills (categorized), summary (free text)
- `PUT /api/profile` already supports partial section updates — no separate save-bullets endpoint needed

#### Step 5.3 — Onboarding Multi-Step Wizard ✅
- Refactored from single-step parse→review to 5-step wizard with step indicator
- Step 1: PDF upload & parse; Step 2: AI-assist experience; Step 3: AI-assist projects; Step 4: AI-assist skills; Step 5: Review & save
- Back/Next/Skip per step, final review shows all editable sections
- Persisted progress (F5.3.9) deferred — future enhancement

#### Step 5.4 — Profile Dashboard AI Enhancement ✅
- Sparkle icon (AI assist) added to each Experience and Project entry card
- AIAssistedContent component opens inline within the entry when toggled
- Skills section has AI categorization panel at the bottom
- Accepted items merged into existing data, close AI panel on accept

---

## Known Issues & Decisions

| Issue | Status |
|-------|--------|
| **Prisma v7 breaking changes** | `datasource.url` removed from schema → use `prisma.config.ts`. `PrismaClient` requires `adapter` option (`PrismaPg` from `@prisma/adapter-pg`). `prisma db push` works. |
| **Better Auth import paths** | `toNextJsHandler` from `better-auth/next-js` (v1.6). `nextCookies()` plugin required for Vercel. |
| **pdf-parse v2 API** | `new PDFParse({data: buffer})` with `.getText()` method. Result is `{ text: string }`. Must call `.destroy()`. |
| **AI SDK removed** | `ai`, `@ai-sdk/openai`, `@google/generative-ai` packages pruned (Phase 5). Direct `fetch` to OpenCode Zen. |
| **OpenCode Zen structured output** | API does NOT support `response_format: { type: "json_schema" }` or `{ type: "json_object" }`. Returns 500 error. **Workaround**: direct `fetch` + manual JSON extraction + Zod validation. |
| **Auth on Vercel** | Better Auth runs as a local API route on Vercel (`src/app/api/auth/[...all]/route.ts`) to keep cookies on the same domain. Render backend handles all other `/api/*` requests via proxy. |
| **Vercel proxy** | `vercel.json` rewrites `/api/*` → Render URL. `/api/auth/*` takes precedence via file routes. |
| **Domain restriction error swallowed** | The hook throws a plain `Error`, not `APIError`. Better Auth catches it and returns generic `"unable to create user"`. Fix pending: import `APIError` from `better-auth` and throw `new APIError("FORBIDDEN", ...)`. |
| **shadcn/ui** | Not used — replaced by custom `src/components/ui/` base components (15 components). |
| **Satoshi font** | Not on Google Fonts or npm/fontsource. Loaded via Fontshare CDN `@import` in `globals.css`. Falls back to `system-ui` if CDN unreachable. |
| **JetBrains Mono** | Installed via `@fontsource-variable/jetbrains-mono` (npm) for variable font support. |
| **Icons** | Using `@phosphor-icons/react` (not lucide-react). |
| **Testing** | Vitest 4 + jsdom + React Testing Library. Run `npm test`. |

## Environment Variables

```
DATABASE_URL=postgresql://...                      # Supabase connection string
GOOGLE_CLIENT_ID=...                                # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...                            # Google OAuth client secret
BETTER_AUTH_SECRET=...                              # Generated via crypto.randomBytes
BETTER_AUTH_URL=http://localhost:3000               # Auth base URL
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000   # Public auth URL
OPENCODE_API_KEY=sk-...                             # OpenCode Zen API key
```
