# Resumint — MVP Implementation Plan

## Tech Stack (Current)

| Layer | Choice |
|-------|--------|
| **Frontend** | Next.js 16.2.9 (App Router, Turbopack), TypeScript, Tailwind CSS v4 |
| **Backend** | Next.js API Routes (serverless monorepo) |
| **AI SDK** | Direct `fetch` to OpenCode Zen (`https://opencode.ai/zen/v1`) — OpenAI-compatible gateway. Model: `deepseek-v4-flash-free` (free tier) |
| **Database** | Supabase PostgreSQL via Prisma v7 ORM + `@prisma/adapter-pg` |
| **Auth** | Better Auth (Google OAuth plugin, `@better-auth/prisma-adapter`, domain restriction via `databaseHooks`) |
| **PDF Parsing** | `pdf-parse` v2 (text extraction) → OpenCode Zen AI (structured JSON extraction) |
| **Hosting** | Vercel (planned) |

---

## Architecture Overview

```
User Browser
    │
    ├── Next.js App (Frontend + API Routes)
    │       │
    │       ├── Better Auth (Google OAuth, session management)
    │       ├── Prisma v7 Client + PrismaPg adapter (database access)
    │       ├── Direct fetch → OpenCode Zen (AI inference)
    │       └── pdf-parse v2 (resume text extraction)
    │
    ├── Supabase PostgreSQL
    └── GitHub API (Phase 2)
```

**Key principle**: Next.js API routes serve as the backend. The Vercel AI SDK (`ai` + `@ai-sdk/openai`) is installed but NOT used — a `RangeError: Invalid time value` bug in `ai@6.0.203` (crashes when API response lacks a `created` timestamp) forced a direct `fetch` approach. If the SDK is updated/fixed, consider migrating back for telemetry and unified interface.

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
├── prisma/
│   ├── schema.prisma                   # 7 models (no datasource.url — Prisma v7)
│   └── migrations/
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing page with Google Sign-In
│   │   ├── globals.css                 # Tailwind entry + design tokens
│   │   ├── access-denied/
│   │   │   └── page.tsx                # NSUT-only restriction page
│   │   ├── onboarding/
│   │   │   └── page.tsx                # Drag-drop PDF → parse → review → save
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Post-onboarding dashboard
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...all]/route.ts   # Better Auth API handlers
│   │   │   ├── resume/
│   │   │   │   └── parse/route.ts      # POST: upload PDF → parse
│   │   │   └── profile/
│   │   │       └── save/route.ts       # POST: save initial profile
│   │   ├── tailor/                     # Phase 3
│   │   ├── history/                    # Phase 4
│   │   └── loading.tsx
│   ├── components/
│   │   ├── ui/                         # (pending shadcn init)
│   │   └── ...
│   ├── lib/
│   │   ├── prisma.ts                   # Prisma v7 singleton (PgAdapter)
│   │   ├── auth.ts                     # Better Auth server config + getServerSession
│   │   ├── auth-client.ts              # Better Auth React client
│   │   ├── ai.ts                       # Direct fetch → OpenCode Zen + JSON extraction
│   │   ├── pdf-parser.ts               # pdf-parse v2 + AI extraction pipeline
│   │   └── validators.ts               # Re-exports from pdf-parser
│   ├── hooks/
│   └── styles/
├── prisma.config.ts                    # Prisma v7 datasource URL config (required)
├── .env.local                          # 7 env vars (DB, Auth, OAuth, API key)
├── tsconfig.json
├── next.config.ts
├── package.json
├── plan.md
└── development_log.md
```

---

## API Design

| Method | Route | Phase | Purpose |
|--------|-------|-------|---------|
| * | `/api/auth/*` | 1 | Better Auth handlers (login, callback, session, logout) |
| POST | `/api/resume/parse` | 1 | Upload PDF → extract text → call OpenCode Zen → return structured JSON |
| POST | `/api/profile/save` | 1 | Save parsed profile data (first-time upsert) |
| GET | `/api/profile` | 2 | Fetch user's full profile |
| PUT | `/api/profile` | 2 | Update profile sections |
| GET | `/api/integrations/github/repos` | 2 | Fetch public repos by username |
| POST | `/api/profile/projects/github-import` | 2 | Import selected repos as projects |
| POST | `/api/resume/tailor` | 3 | Accept JD + profile → AI tailoring → return tailored JSON |
| POST | `/api/resume/export-pdf` | 3 | Compile tailored data into downloadable PDF |
| GET | `/api/history` | 4 | List all tailored resumes |
| GET | `/api/history/[id]` | 4 | Fetch single historical resume |
| DELETE | `/api/history/[id]` | 4 | Delete a historical resume |
| PUT | `/api/history/[id]/styling` | 4 | Update style config for a resume |

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

### Phase 4: History, Templates & Polish (Pending)

---

## Known Issues & Decisions

| Issue | Status |
|-------|--------|
| **Prisma v7 breaking changes** | `datasource.url` removed from schema → use `prisma.config.ts`. `PrismaClient` requires `adapter` option (`PrismaPg` from `@prisma/adapter-pg`). `prisma db push` works. |
| **Better Auth import paths** | `toNextJsHandler` from `better-auth/integrations/next-js`, not `better-auth/next-js`. |
| **pdf-parse v2 API** | `new PDFParse({data: buffer})` with `.getText()` method. Result is `{ text: string }`. Must call `.destroy()`. |
| **AI SDK `RangeError: Invalid time value`** | `ai@6.0.203` crashes at `responseData.timestamp.toISOString()` when API response lacks a `created` timestamp. OpenCode Zen doesn't return one. **Workaround**: direct `fetch` instead of `generateText`/`generateObject`. |
| **OpenCode Zen structured output** | API does NOT support `response_format: { type: "json_schema" }` or `{ type: "json_object" }`. Returns 500 error. **Workaround**: use `generateText` (now direct `fetch`) + manual JSON extraction + Zod validation. |
| **Multiple lockfiles warning** | Fix by adding `turbopack.root` to `next.config.ts`. Currently benign. |
| **Dev server background process** | `Start-Process` fails with EPERM in this shell. Use `cmd /c start /B cmd /c "..."` with `--%` to bypass PS parser. |
| **Domain restriction error swallowed** | The hook throws a plain `Error`, not `APIError`. Better Auth catches it and returns generic `"unable to create user"` because `isAPIError()` returns `false`. Fix: import `APIError` from `better-auth` and throw `new APIError("FORBIDDEN", ...)`. |

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
