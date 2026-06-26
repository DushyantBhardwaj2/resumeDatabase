# Phase 1: Authentication & Cold Start (Resume Parsing)

## 1. Objective
Build the entry point of the Resumint application, allowing users to securely authenticate using their institutional email domain (`@nsut.ac.in`) and initialize their profiles by uploading and parsing an existing PDF resume.

---

## 2. User Experience Flow
1. **Landing & Call to Action**:
   - The user visits the homepage.
   - An elegant "Sign in with Google" button prompts the user to authenticate.
2. **Institutional Log In**:
   - The user logs in via Google OAuth.
   - The system validates that the email address belongs to the `@nsut.ac.in` domain via a Better Auth `databaseHooks.user.create.before` hook.
   - If not authorized, redirect to `/access-denied` with `?error=unable_to_create_user`.
   - If authorized, redirect to the onboarding screen (`/onboarding`).
3. **First-Time Setup (PDF Resume Upload)**:
   - The user is presented with a file upload zone supporting drag-and-drop for PDF files (max 5MB).
   - A loading state appears showing that the system is extracting their information.
4. **Multi-Step Profile Building**:
   - **Step 1**: PDF upload → AI parses into structured sections (existing flow).
   - **Step 2**: Add experience entries via AI-assisted component (paste descriptions, AI generates bullet points, select to keep).
   - **Step 3**: Add skills via AI-assisted categorization (free text → AI categorizes into languages/frameworks/tools).
   - **Step 4**: GitHub integration / project import (optional, skippable).
   - **Step 5**: Review all sections and save.
   - Each step can be skipped. On save, redirect to `/dashboard`.
   - *See `docs/data_saving_planning.md` for the Universal AI-Assisted Content Creation specification.*

---

## 3. Technical Requirements

### A. Authentication
- **Provider**: Better Auth with Google OAuth2 plugin (`socialProviders.google`).
- **Adapter**: `@better-auth/prisma-adapter` with Prisma v7 + PostgreSQL.
- **Domain Restriction**: `databaseHooks.user.create.before` hook:
  ```javascript
  if (!user.email.toLowerCase().endsWith("@nsut.ac.in")) {
    throw new Error("Access restricted to NSUT students/staff.");
  }
  ```
- **Known Issue**: Throwing a plain `Error` causes Better Auth to return generic `"unable to create user"` instead of the actual message. Should throw `APIError("FORBIDDEN", ...)` instead.
- **Session**: Cookie-based, managed by Better Auth. Use `getServerSession(headers)` in API routes, `createAuthClient()` on client.
- **Redirect URI**: `https://resume-database.vercel.app/api/auth/callback/google` (set in Google Cloud Console — must match Vercel domain).
- **API Route**: All `/api/*` endpoints including auth are handled by the **Render backend** and proxied via Vercel rewrites. See `docs/vercel_deployment.md` for the full architecture.

### B. PDF Parsing & Extraction Pipeline
1. **File Upload Handling**: Accept only `.pdf` files, limit file size to 5MB, validated client-side and server-side.
2. **Text Extraction**: Uses `pdf-parse` v2 API:
   ```typescript
   const pdf = new PDFParse({ data: buffer })
   const result = await pdf.getText()
   await pdf.destroy()
   return result.text
   ```
3. **AI Structure Generation** (via direct `fetch` to OpenCode Zen):
   - Send raw text to `https://opencode.ai/zen/v1/chat/completions` with model `deepseek-v4-flash-free`.
   - System prompt requests structured JSON output with explicit schema.
   - Response text is extracted from `choices[0].message.content`.
   - JSON is extracted via `extractJson()` helper (handles markdown code fences, raw braces).
   - Validated against Zod schema (`parsedResumeSchema`) before returning.
4. **Endpoints** (all authenticated routes use `/api/protected/*` prefix):
   - `POST /api/protected/resume/parse` — file upload → text extraction → AI parsing → Zod validation → return `{ rawText, parsed }`
   - `POST /api/protected/profile` — accept `{ rawText, parsed }` → upsert to Profiles table

### C. Database Schema (Current — Prisma v7)

**User model** (Better Auth managed):
| Column | Type | Notes |
|--------|------|-------|
| id | String (UUID) | PK, auto-generated |
| email | String | Unique, from Google OAuth |
| name | String? | From Google OAuth |
| emailVerified | Boolean | |
| image | String? | Avatar URL |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Profile model** (1-to-1 with User):
| Column | Type | Notes |
|--------|------|-------|
| id | String (UUID) | PK |
| userId | String (UUID) | FK → User, unique |
| rawResumeText | String? | Raw extracted PDF text |
| contact | Json? | `{phone, linkedin, github, portfolio}` |
| education | Json? | `[{school, degree, gpa, startYear, endYear}]` |
| experience | Json? | `[{company, role, startDate, endDate, bullets}]` |
| projects | Json? | `[{title, techStack, bullets, url}]` |
| skills | Json? | `{languages, frameworks, tools}` |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Session, Account, Verification models** — standard Better Auth tables.

**GitHubRepo, TailoredResume models** — defined in schema, unused until Phase 2/3.

### D. Key Libraries & Versions
| Library | Version | Notes |
|---------|---------|-------|
| next | 16.2.9 | App Router, Turbopack |
| prisma | 7.x | Major v7 breaking changes (no `datasource.url` in schema) |
| @prisma/adapter-pg | latest | Required by Prisma v7 |
| pg | latest | PostgreSQL driver |
| better-auth | latest | Auth framework |
| @better-auth/prisma-adapter | latest | Prisma adapter for Better Auth |
| pdf-parse | 2.x | v2 uses `new PDFParse({data}).getText()` |
| ai | 6.0.203 | **Installed but unused** — has `RangeError` bug |
| @ai-sdk/openai | latest | **Installed but unused** |

### E. AI Provider Details
| Property | Value |
|----------|-------|
| Endpoint | `https://opencode.ai/zen/v1/chat/completions` |
| Model | `deepseek-v4-flash-free` (free tier) |
| Method | Direct `fetch` (not Vercel AI SDK) |
| Temp | 0 (deterministic) |
| Key | `sk-0kxbazSkwxd8THILIBcTXvHrW9yj4Tu2SnL4ALacZrxABQRiG9we0GjMCvQ4nKbV` |

**Why not Vercel AI SDK?**
1. `generateObject` requires `response_format: { type: "json_schema" }` — OpenCode Zen doesn't support it (500 error).
2. `generateText` works, but `ai@6.0.203` crashes with `RangeError: Invalid time value` at `responseData.timestamp.toISOString()` because OpenCode Zen responses lack a `created` field.
3. Direct `fetch` avoids both issues entirely.

---

## 4. Key Endpoints & APIs

### `* /api/auth/**`
Better Auth handler runs **directly on Vercel** via `src/app/api/auth/[...all]/route.ts` (file routes take precedence over proxy rewrites). Handles Google OAuth flow, session management, sign-out. Keeps session cookies on the same domain, avoiding cross-domain cookie issues.

### `POST /api/protected/resume/parse`
**Auth**: Required (session check via `/api/protected/*` middleware).
**Request**: `multipart/form-data` with `file` field (PDF, max 5MB).
**Response** (200):
```json
{ "rawText": "...", "parsed": { "contact": {...}, "education": [...], ... } }
```
**Response** (errors): `{ "error": "..." }` — 400/401/422/500.
**Pipeline**: Validations → `Buffer` → `pdf-parse` text extraction → `ResumeUseCases.parseResume()` (AI parsing + Zod validation).

### `POST /api/protected/profile`
**Auth**: Required (session check via `/api/protected/*` middleware).
**Request**: `{ rawText: string, parsed: ParsedResume }`.
**Response** (200): `{ profile: {...} }`.
**Logic**: Uses `ProfileUseCases.saveFromOnboarding()` to upsert Profile with `rawResumeText` + parsed fields for `session.user.id`. Errors return `{ error: "..." }`.

---

## 5. Definition of Done
- [x] Users cannot authenticate with non-@nsut.ac.in emails.
- [x] Successful Google login creates a user account in the database.
- [x] PDF upload extracts text and calls the AI model successfully.
- [x] Structured JSON is generated and displayed back to the user in a form.
- [x] Saving the form inserts the profile details into the database.

---

## 6. Project Files (Phase 1)

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | 7 models (no `datasource.url`) |
| `prisma.config.ts` | Prisma v7 datasource URL config |
| `backend/src/index.ts` | Express (Hono) server — all API routes including `/api/protected/*` |
| `backend/src/config/auth.ts` | Better Auth config (shared, runs on Render) |
| `backend/src/di/container.ts` | Dependency injection container |
| `backend/src/core/application/use-cases/resume-use-cases.ts` | `parseResume(buffer)` — PDF text extraction + AI parsing |
| `backend/src/core/application/use-cases/profile-use-cases.ts` | `saveFromOnboarding(rawText, parsed)` — profile upsert |
| `src/config/auth-client.ts` | Better Auth React client (points to Render via `NEXT_PUBLIC_API_URL`) |
| `src/config/auth.ts` | Server-side session fetch (calls Render) |
| `src/app/page.tsx` | Landing page |
| `src/app/onboarding/page.tsx` | Upload → parse → review → save |
| `src/app/dashboard/page.tsx` | Post-onboarding dashboard |
| `src/app/access-denied/page.tsx` | NSUT-only restriction page |
| `globals.css` | Tailwind v4 + design tokens |

