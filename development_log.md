# Development Log — Resumint MVP

> **Started**: 2026-06-13
> **Status**: Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅

---

## 2026-06-14

### Phase 1 Finalization — Remaining 2 Features

- [x] **F1.2.7** — Redirect logic: created `src/app/auth/redirect/page.tsx` (server component checks profile existence → `/dashboard` or `/onboarding`). Updated landing page `callbackURL` to `/auth/redirect`.
- [x] **F1.4.4** — Toast notifications: installed `sonner`, added `<Toaster>` to root layout, wired `toast.success`/`toast.error` into onboarding `handleSave`.
- [x] Updated `docs/feature_checklist.md` — Phase 1 now 22/22.
- [x] All features compile cleanly (`tsc --noEmit` passes).

## 2026-06-13

### Plan & Setup

- [x] Read all project documentation
- [x] Confirmed tech stack: Next.js 16, TypeScript, Tailwind CSS v4, Prisma v7 + Supabase, Better Auth, OpenCode Zen AI, Vercel
- [x] Wrote `plan.md` — full architecture, schema, API design, folder structure, sequential steps
- [x] Initialized `development_log.md`

### Step 1.1 — Project Initialization

- [x] Created Next.js 16 project with TypeScript + App Router + Tailwind CSS v4
- [x] Installed dependencies: Prisma v7, Better Auth, `ai` + `@ai-sdk/openai`, `pdf-parse` v2, `zod`
- [x] Installed Prisma PostgreSQL adapter (`@prisma/adapter-pg`, `pg`)
- [x] Set up `prisma/schema.prisma` with all 7 models (User, Session, Account, Verification, Profile, GitHubRepo, TailoredResume)
- [x] Fixed Prisma v7 breaking changes (no `url` in schema, requires adapter in PrismaClient, `prisma.config.ts`)
- [x] Generated Prisma client successfully
- [x] Ran `prisma db push` to sync schema to Supabase
- [x] Created `.env.example` and `.env.local` with all 7 env vars

### Step 1.2 — Authentication (Better Auth + Google OAuth)

- [x] Configured Better Auth in `src/lib/auth.ts` with:
  - Prisma adapter
  - Google OAuth social provider
  - Domain restriction hook (`@nsut.ac.in`) via `databaseHooks.user.create.before`
- [x] Created Better Auth API route handler at `src/app/api/auth/[...all]/route.ts` — uses `toNextJsHandler` from `better-auth/integrations/next-js`
- [x] Created auth client at `src/lib/auth-client.ts`
- [x] Created server session helper (`getServerSession`)
- [x] Created `src/app/access-denied/page.tsx`
- [x] Verified OAuth redirect URI: `http://localhost:3000/api/auth/callback/google`
- [x] Confirmed domain restriction works: `@gmail.com` → `unable_to_create_user` (expected)
- [x] **Bug**: Domain restriction error message swallowed by Better Auth (plain `Error` → generic `"unable to create user"`). Fix: throw `APIError("FORBIDDEN", ...)` instead.

### Step 1.3 — Landing Page

- [x] Built premium landing page with branding, tagline, Google Sign-In button, feature cards
- [x] Responsive layout with Tailwind
- [x] Updated `globals.css` with design tokens

### Step 1.4 — Onboarding: Resume Upload & Parsing

- [x] Created `src/lib/ai.ts` — AI wrapper (originally `generateObject`, then `generateText`, now direct `fetch`)
- [x] Created `src/lib/pdf-parser.ts` — pdf-parse v2 (`new PDFParse({data: buffer}).getText()`) + AI extraction pipeline
- [x] Created `src/lib/validators.ts` — Zod schemas for resume data validation
- [x] Created `POST /api/resume/parse` — file upload → text extraction → AI parsing → Zod validation
- [x] Created `POST /api/profile/save` — persist parsed profile to database (upsert)
- [x] Built onboarding UI with drag-and-drop upload, parsing animation, editable review form
- [x] Created `src/app/dashboard/page.tsx` — post-onboarding dashboard with session check + sign-out

### Step 1.5 — Error Handling & Polish

- [x] Added try-catch wrappers to all API routes (return JSON 500 instead of Next.js HTML error page)
- [x] Fixed client error handling order: parse JSON first, check `res.ok` second
- [x] Added proper error messages displayed in UI
- [x] Fixed `extractJson` helper to handle markdown code fences and raw JSON extraction
- [x] Strengthened AI prompt with full expected JSON schema structure

### AI Provider Evolution

**Iteration 1** — Google Gemini (original plan):
- Planned to use `@google/generative-ai` with the Vercel AI SDK
- Abandoned in favor of free tier

**Iteration 2** — OpenCode Zen + Vercel AI SDK `generateObject`:
- Switched to `https://opencode.ai/zen/v1` with `@ai-sdk/openai`
- Used `generateObject` with Zod schema for native structured output
- **FAILED**: OpenCode Zen doesn't support `response_format: { type: "json_schema" }` → returns 500

**Iteration 3** — OpenCode Zen + Vercel AI SDK `generateText`:
- Switched to `generateText` + manual JSON extraction + Zod validation
- **FAILED**: `ai@6.0.203` crashes with `RangeError: Invalid time value` at `responseData.timestamp.toISOString()` when API response lacks a `created` timestamp

**Iteration 4 (Current)** — OpenCode Zen + direct `fetch`:
- Removed dependency on `ai`/`@ai-sdk/openai` at runtime (packages still installed for potential future use)
- Direct `fetch` to `https://opencode.ai/zen/v1/chat/completions`
- Manual JSON extraction via `extractJson()` + Zod validation
- **WORKING**: No SDK bug interference
- Detection by confirmation ping: returns valid JSON

### Known Issues

- [ ] **AI SDK bug**: `ai@6.0.203` throws `RangeError: Invalid time value` when API lacks `created` timestamp. If a future version fixes this, consider migrating back for telemetry benefits.
- [ ] **Domain restriction UX**: Plain `Error` in hook gets swallowed by Better Auth → user sees generic `unable_to_create_user`. Should throw `APIError("FORBIDDEN", ...)` for proper message propagation.
- [ ] **Multiple lockfiles warning**: Set `turbopack.root` in `next.config.ts` to silence.
- [ ] **shadcn/ui**: Not initialized yet — pending.
- [x] **Toast notifications**: sonner added + wired in onboarding save.
- [ ] **Model**: Currently using free-tier `deepseek-v4-flash-free`. May need to switch to a better model for production.

### Phase 2 — Complete

- [x] **Step 2.1** — Dashboard layout with nav sidebar (`src/app/dashboard/layout.tsx`, `nav.tsx`), tabbed overview with summary cards
- [x] **Step 2.2** — `GET /api/profile` + `PUT /api/profile` endpoints (`src/app/api/profile/route.ts`)
- [x] **Step 2.3** — Full profile editor with inline editing for Contact, Education, Experience, Projects, Skills; drag-and-drop reorder for Experience and Projects; add/remove; Save with toast
- [x] **Step 2.4** — Profile completeness score utility (`src/lib/profile-utils.ts`) with color-coded progress bar
- [x] **Step 2.5** — GitHub API endpoints: `GET /api/integrations/github/repos`, `POST /api/profile/projects/github-import` (with AI README summarization)
- [x] **Step 2.6** — GitHub Integrations tab: connect username, browse repos, multi-select import, re-sync button
- [x] **Step 2.7** — Checklist updated: Phase 2 = 21/21, Total = 43/84

## 2026-06-14 (later)

### Phase 3 — Resume Tailoring & AI Generation

- [x] **Step 3.1** — Tailor input page (`src/app/tailor/page.tsx`): Job Title, Company, JD textarea, validation (≥50 chars), "Generate" button. Enabled nav link in sidebar.
- [x] **Step 3.2** — `POST /api/resume/tailor` (`src/app/api/resume/tailor/route.ts`): fetches user profile, runs AI with strict anti-hallucination prompt, returns tailored JSON, auto-saves to `TailoredResume` table.
- [x] **Step 3.3** — Multi-step loading animation with bouncing dots and rotating status messages. Error handling with retry via toast.
- [x] **Step 3.4** — Side-by-side diff preview: original (left) vs. tailored (right) with blue highlight border on changed sections. Editable bullet points via inline textarea.
- [x] **Step 3.5** — PDF export via `window.print()` with ATS-friendly print CSS (Times New Roman, 11pt, letter margins). Document title set for filename.
- [x] **Step 3.6** — Checklist updated: Phase 3 = 18/18, Total = 61/84.

### Next Steps

Cleanup remaining:
- [ ] Initialize shadcn/ui (`npx shadcn@latest init`)
- [ ] Add edge case handling (large file errors, network failures)
- [ ] Fix domain restriction error message (use `APIError`)

Phase 4 — History & Templates
