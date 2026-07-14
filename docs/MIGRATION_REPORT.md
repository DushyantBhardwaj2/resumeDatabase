# Resumint — Comprehensive Migration Report

> **Author:** Staff Software Engineer
> **Status:** Audit Complete — Awaiting Approval
> **Date:** 2026-07-14
> **Purpose:** Document the gap between current architecture and target (Phase 6), and provide a phased implementation plan for approval.

---

## Table of Contents

1. [Current Architecture Overview](#1-current-architecture-overview)
2. [Gap Analysis: File-by-File Classification](#2-gap-analysis-file-by-file-classification)
3. [Gap Analysis: Prisma Schema](#3-gap-analysis-prisma-schema)
4. [Gap Analysis: API Routes](#4-gap-analysis-api-routes)
5. [Gap Analysis: DI Container](#5-gap-analysis-di-container)
6. [Gap Analysis: Frontend](#6-gap-analysis-frontend)
7. [Cross-Doc Inconsistencies](#7-cross-doc-inconsistencies)
8. [Phased Migration Plan](#8-phased-migration-plan)
9. [Key Risks & Mitigations](#9-key-risks--mitigations)
10. [Approval Gate](#10-approval-gate)

---

## 1. Current Architecture Overview

### Current State
The application is a **profile-centric resume builder** with:
- **Backend:** Hono + Prisma + BullMQ + BetterAuth on Render (Node/TS)
- **Frontend:** Next.js 16 + Zustand + Tailwind v4 + Hono RPC on Vercel
- **Database:** PostgreSQL via Neon, managed through Prisma
- **AI:** OpenCodeZen service (opencode.ai/zen API)
- **PDF:** LaTeX → pdflatex pipeline via BullMQ workers

### What Works Well (KEEP as-is)
- Hexagonal architecture (ports + adapters) with manual DI container
- BullMQ + Redis async PDF compilation pipeline
- Prisma ORM with type-safe schema migrations
- LaTeX compilation pipeline (pdflatex in temp dirs)
- BetterAuth integration (Google OAuth, session management)
- Rate limiter middleware (Redis-backed)
- Pino structured logging
- Hono RPC client (type-safe frontend/backend communication)

### Target Architecture (Phase 6)
A **chat-driven Career Vault** with:
- **Career Memory**: Typed domain entities (Experience, Project, Education, Skill, Certificate, Achievement) replacing the single Profile JSON blob
- **Resume Drafts**: Frozen snapshots with KB version tracking, replacing the tightly-coupled live Profile → Resume pipeline
- **Knowledge Base**: Filesystem-driven prompt/rule system replacing `infrastructure/prompts/index.ts`
- **Retriever Service**: Deterministic keyword matching + scoring for entry selection
- **ResumeSpec Engine**: Template-aware constraints applied deterministically after AI selection
- **System Confidence**: Provenance-based per-field confidence scoring
- **Resume Fit Score**: JD-skill coverage computation
- **Global Chat**: Single chat mode replacing 5 siloed modes; `MemoryAction[]` response format replacing `{ intent, targetWidget }`

---

## 2. Gap Analysis: File-by-File Classification

### 2.1 Files to KEEP (12 files — no changes needed)

| File | Rationale |
|------|-----------|
| `config/auth.ts` | BetterAuth config unchanged |
| `config/auth-client.ts` | Auth client unchanged |
| `config/prisma.ts` | Prisma client singleton unchanged |
| `infrastructure/ai/index.ts` | OpenCodeZenAIService — KEEP, minor : add `generate()` method to IAIService port |
| `infrastructure/logger.ts` | Pino logger unchanged |
| `infrastructure/rate-limiter.ts` | Redis-backed rate limiter unchanged |
| `infrastructure/queue/redis.ts` | Redis connection unchanged |
| `infrastructure/latex/latex-compiler.ts` | pdflatex execution unchanged |
| `infrastructure/latex/templates/*` | Template files unchanged |
| `infrastructure/pdf/index.ts` | PDF parser unchanged |
| `interface/types.ts` | Hono Variables type unchanged |
| `env-init.ts` | Environment initialization unchanged |

### 2.2 Files to EVOLVE (6 files — incremental changes)

| File | What Changes |
|------|-------------|
| `shared/index.ts` | ADD: JDAnalysis, ResumeDraft, ResumeSelection, ResumeSpec, MemoryAction, MergeAction, RawMemory, EntrySummary, ResumeFit, ChatIntent (revised). KEEP: VaultBullet. REMOVE: Profile, TailoredOutput, parsedResumeSchema, SECTION_SCHEMAS, SectionName, BulletCategory |
| `core/domain/entities.ts` | ADD: domain interfaces for Experience, Project, Education, etc. REMOVE: Profile, Contact, Skills |
| `core/domain/repositories.ts` | ADD: IMemoryRepository (generic), IExperienceRepository, IProjectRepository, IEducationRepository, ISkillRepository, ICertificateRepository, IAchievementRepository, IResumeDraftRepository, IRawMemoryRepository, IBulletRepository, IChatRepository. REMOVE: IProfileRepository, ITailoredResumeRepository, IGitHubRepoRepository |
| `infrastructure/persistence/chat-repository.ts` | Remove mode column, evolve to global history |
| `infrastructure/latex/latex-template.ts` | Accept ResumeDraft input instead of Profile |
| `infrastructure/queue/pdf-queue.ts` | Accept CompileJob type (instead of full profile data) |
| `infrastructure/queue/pdf-worker.ts` | Read from ResumeDraft table instead of in-memory profile |

### 2.3 Files to REWRITE (6 files — significant changes)

| File | What Changes |
|------|-------------|
| `index.ts` | Mount new routes: memory, drafts, compile, github, parse, kb. Remove: profile, ai, resume/tailor |
| `di/container.ts` | Register all new services (RetrieverService, ResumeSpecEngine, ConfidenceService, ResumeFitService), use cases (MemoryUseCases, DraftUseCases, ResumeEngine, ParseUseCases, KBUseCases), repos (all 7 domain repos + IChatRepository port), infrastructure (IKnowledgeBaseService, ICompilerService, IGitHubAnalyzer) |
| `core/application/use-cases/chat-use-cases.ts` | Global chat pipeline: save message → classify intent → retriever/AI → return MemoryAction[] + reply. New constructor: `(aiService, knowledgeBase, retriever, resumeEngine, chatRepo)` |
| `core/application/use-cases/github-use-cases.ts` | Deterministic extraction pipeline: analyze → extract README + languages + commits → create RawMemory + MemoryAction[] |
| `core/application/use-cases/history-use-cases.ts` | Operate on ResumeDraft table instead of TailoredResume |
| `interface/routes/chat.ts` | Single /interact endpoint returning structured MemoryAction[] response |

### 2.4 Files to ADD (29 new files)

**Ports (7):**
| File | Purpose |
|------|---------|
| `core/application/ports/knowledge-base.ts` | IKnowledgeBaseService — getBundle(), getContext(intent), getPrompt() |
| `core/application/ports/retriever.ts` | IRetrieverService — search(query, options) → EntrySummary[] |
| `core/application/ports/resume-engine.ts` | IResumeEngine — createDraft(jd, userId) → ResumeDraft |
| `core/application/ports/resume-spec.ts` | IResumeSpecEngine — apply(spec, selections) → FilteredSelections |
| `core/application/ports/system-confidence.ts` | IConfidenceService — compute(source) → number |
| `core/application/ports/compiler.ts` | ICompilerService — compile(draftId) → { jobId } |
| `core/application/ports/github-analyzer.ts` | IGitHubAnalyzer — analyze(url) → RepoAnalysis |
| `core/application/ports/resume-fit.ts` | IResumeFitService — compute(draftId) → ResumeFitScore |

**Services (4):**
| File | Purpose |
|------|---------|
| `core/application/services/retriever.ts` | Keyword matching, scoring, merge detection |
| `core/application/services/resume-spec.ts` | Rule application, truncation, reordering |
| `core/application/services/system-confidence.ts` | Provenance-based confidence computation |
| `core/application/services/resume-fit.ts` | JD-skill matching and coverage computation |

**Use Cases (4):**
| File | Purpose |
|------|---------|
| `core/application/use-cases/memory-use-cases.ts` | Career Memory CRUD + search + pin + applyActions |
| `core/application/use-cases/draft-use-cases.ts` | Resume Draft CRUD + compile orchestration + resume fit |
| `core/application/use-cases/resume-engine.ts` | JD → retrieve → select → spec → draft pipeline |
| `core/application/use-cases/parse-use-cases.ts` | PDF upload → parse → MemoryAction[] |
| `core/application/use-cases/kb-use-cases.ts` | Knowledge Base version info |

**Infrastructure (10):**
| File | Purpose |
|------|---------|
| `infrastructure/knowledge-base/loader.ts` | File system loading at startup |
| `infrastructure/knowledge-base/bundle.ts` | Knowledge bundle generation |
| `infrastructure/persistence/experience-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/project-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/education-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/skill-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/certificate-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/achievement-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/bullet-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/raw-memory-repository.ts` | Prisma CRUD |
| `infrastructure/persistence/draft-repository.ts` | Prisma CRUD |
| `infrastructure/github/analyzer.ts` | GitHub API + deterministic extraction |

**Routes (6):**
| File | Purpose |
|------|---------|
| `interface/routes/memory.ts` | Career Memory CRUD routes |
| `interface/routes/drafts.ts` | Resume Draft CRUD routes |
| `interface/routes/compile.ts` | Compile status/result routes (from drafts) |
| `interface/routes/github.ts` | GitHub analyze/import routes |
| `interface/routes/parse.ts` | PDF upload → parse route |
| `interface/routes/kb.ts` | KB version route |

### 2.5 Files to REMOVE (8 files)

| File | Replaced By |
|------|-------------|
| `core/application/use-cases/profile-use-cases.ts` | memory-use-cases.ts |
| `core/application/use-cases/ai-use-cases.ts` | Single-responsibility prompts in KB |
| `core/application/use-cases/resume-use-cases.ts` | resume-engine.ts + draft-use-cases.ts |
| `infrastructure/persistence/profile-repository.ts` | Domain-specific repositories |
| `infrastructure/persistence/tailored-resume-repository.ts` | draft-repository.ts |
| `infrastructure/persistence/github-repo-repository.ts` | raw-memory-repository.ts + project-repository.ts |
| `infrastructure/prompts/index.ts` | knowledge/ KB files |
| `infrastructure/profile-utils.ts` | Confidence service |
| `interface/routes/profile.ts` | memory.ts |
| `interface/routes/ai.ts` | Absorbed into chat.ts + compile.ts |
| `interface/schemas/compile-live.ts` | draft-based compile |

### Summary

| Action | Count |
|--------|-------|
| KEEP | 12 |
| EVOLVE | 7 |
| REWRITE | 6 |
| ADD | 29 |
| REMOVE | 11 |
| **Total affected** | **65** |

---

## 3. Gap Analysis: Prisma Schema

### 3.1 Current vs. Target Models

| Current Model | Verdict | Target Model | Status |
|---------------|---------|-------------|--------|
| User | ✅ KEEP | User | Unchanged |
| Session | ✅ KEEP | Session | Unchanged |
| Account | ✅ KEEP | Account | Unchanged |
| Verification | ✅ KEEP | Verification | Unchanged |
| Profile | ⚠️ STRIP → REMOVE | Profile (temp) → remove 4 fields now, drop entirely Phase 3 | **4 fields to remove** (`githubUsername`, `rawResumeText`, `leadership`, `achievements`) |
| GitHubRepo | ❌ REMOVE | — | Replaced by RawMemory + Project |
| ChatMessage | ⚠️ EVOLVE | ChatMessage | **Remove** `widget`, `mode`. Constrain `role` to enum. |
| TailoredResume | ❌ REMOVE | ResumeDraft | Full replacement |
| **—** | 🆕 ADD | Experience | 10 fields + Bullet[] relation |
| **—** | 🆕 ADD | Project | 14 fields + Bullet[] relation |
| **—** | 🆕 ADD | Education | 8 fields |
| **—** | 🆕 ADD | Skill | 5 fields |
| **—** | 🆕 ADD | Certificate | 5 fields |
| **—** | 🆕 ADD | Achievement | 6 fields |
| **—** | 🆕 ADD | Bullet | 6 fields (polymorphic parent) |
| **—** | 🆕 ADD | ResumeDraft | 10 fields |
| **—** | 🆕 ADD | RawMemory | 5 fields |

### 3.2 Critical Missing Indexes

| Table | Missing Index | Impact |
|-------|---------------|--------|
| All Career Memory tables | `@@index([userId])` | Per-user query performance |
| Bullet | `@@index([parentType, parentId])` | Efficient polymorphic lookups |
| ChatMessage | `@@index([userId, createdAt])` | "last 20 messages" query |
| Skill | `@@unique([userId, name])` | Prevent duplicate skill names |
| ResumeDraft | `@@index([userId])` | List user drafts |
| RawMemory | `@@index([userId])` | User-scoped queries |

### 3.3 Data Migration Needed

One-time migration script to transform existing Profile JSON blobs into typed domain entries:
- `profile.experience` → `Experience[]` + `Bullet[]`
- `profile.projects` → `Project[]` + `Bullet[]`
- `profile.education` → `Education[]`
- `profile.skills` → `Skill[]`
- `profile.certificates` → `Certificate[]`
- `profile.achievements` → `Achievement[]`
- `profile.extracurriculars` → `Achievement[]` (type: VOLUNTEER/LEADERSHIP)
- `profile.leadership` → `Achievement[]` (type: LEADERSHIP)

---

## 4. Gap Analysis: API Routes

### 4.1 Current Routes (26 total)

| # | Method | Path | Verdict |
|---|--------|------|---------|
| H1 | GET | `/api/health` | ✅ KEEP |
| H2 | GET/POST | `/api/auth/**` | ✅ KEEP |
| P1-P3 | GET/POST/PATCH | `/api/protected/profile` | ❌ REMOVE |
| R1 | POST | `/api/protected/resume/tailor` | ❌ REMOVE |
| R2 | POST | `/api/protected/resume/parse` | 🔄 REWRITE (return MemoryAction[]) |
| R3 | POST | `/api/protected/resume/compile` | ❌ REMOVE (501 stub) |
| R4 | POST | `/api/protected/resume/compile-live` | 🔄 REWRITE (accept draftId) |
| R5 | GET | `/api/protected/resume/compile-status/:jobId` | 🔄 MOVE to compile.ts |
| R6 | GET | `/api/protected/resume/compile-result/:jobId` | 🔄 MOVE to compile.ts |
| A1-A3 | POST | `/api/protected/ai/*` | ❌ REMOVE |
| C1 | POST | `/api/protected/chat/interact` | 🔄 REWRITE (MemoryAction[] response) |
| C2 | POST | `/api/protected/chat/save` | 🔄 REWRITE (batch messages, no mode) |
| C3 | GET | `/api/protected/chat/history` | 🔄 REWRITE (global history) |
| C4 | DELETE | `/api/protected/chat/clear` | 🔄 REWRITE (global clear) |
| Hi1-Hi5 | GET/DELETE/PATCH/PUT | `/api/protected/history/*` | 🔄 REWRITE (operate on ResumeDraft) |

### 4.2 Target Routes (23 documented + 1 health)

| # | Method | Path | Status |
|---|--------|------|--------|
| — | GET | `/api/health` | ✅ Exists |
| — | GET/POST | `/api/auth/**` | ✅ Exists |
| D1 | POST | `/api/protected/chat/interact` | 🔄 Rewrite |
| D2 | POST | `/api/protected/chat/save` | 🔄 Rewrite |
| D3 | GET | `/api/protected/memory` | 🆕 **Missing** |
| D4 | GET | `/api/protected/memory/:type/:id` | 🆕 **Missing** |
| D5 | PATCH | `/api/protected/memory/:type/:id` | 🆕 **Missing** |
| D6 | DELETE | `/api/protected/memory/:type/:id` | 🆕 **Missing** |
| D7 | GET | `/api/protected/memory/count` | 🆕 **Missing** |
| D8 | GET | `/api/protected/memory/export` | 🆕 **Missing** |
| D9 | POST | `/api/protected/resume-drafts` | 🆕 **Missing** |
| D10 | GET | `/api/protected/resume-drafts` | 🆕 **Missing** |
| D11 | GET | `/api/protected/resume-drafts/:id` | 🆕 **Missing** |
| D12 | PATCH | `/api/protected/resume-drafts/:id` | 🆕 **Missing** |
| D13 | DELETE | `/api/protected/resume-drafts/:id` | 🆕 **Missing** |
| D14 | POST | `/api/protected/resume/compile-live` | 🔄 Rewrite |
| D15 | GET | `/api/protected/resume/compile-status/:jobId` | 🔄 Move to compile.ts |
| D16 | GET | `/api/protected/resume/compile-result/:jobId` | 🔄 Move |
| D17 | POST | `/api/protected/resume/parse` | 🔄 Rewrite |
| D18 | POST | `/api/protected/github/analyze` | 🆕 **Missing** |
| D19 | POST | `/api/protected/github/import` | 🆕 **Missing** |
| D20 | GET | `/api/protected/kb/version` | 🆕 **Missing** |

**14 documented routes have zero implementation in code.**

### 4.3 Critical Request/Response Shape Mismatches

| Route | Current Shape | Target Shape |
|-------|---------------|--------------|
| `POST /chat/interact` | Unvalidated `c.req.json()` | `{ message: string, activeDraftId?: string }` |
| `POST /chat/save` | `{ role, content, widget?, mode }` (single msg) | `{ messages: { role, content }[] }` (batch) |
| `POST /compile-live` | Full profile + bullet selections + contact | `{ draftId: string }` |
| `POST /resume/parse` | Returns `{ rawText, parsed }` (Profile format) | Returns `{ actions: MemoryAction[] }` |
| `GET /compile-status` | Status enum: `"queued"\|"active"\|"completed"\|"failed"` | Status enum: `"queued"\|"compiling"\|"ready"\|"error"` |

---

## 5. Gap Analysis: DI Container

### 5.1 Excess Dependencies (11 to remove)

| Dependency | Reason |
|------------|--------|
| ProfileUseCases → ProfileRepository | Profile table deprecated |
| ResumeUseCases → TailoredResumeRepository | TailoredResume → ResumeDraft |
| AiUseCases | Replaced by KB prompts |
| GitHubRepoRepository | Replaced by RawMemory + Project |
| ChatRepository (no port) | Needs IChatRepository port |
| All prompts from `infrastructure/prompts/index.ts` | Moved to knowledge/ KB directory |

### 5.2 Missing Dependencies (21+)

| Category | Missing Items |
|----------|---------------|
| **Ports** (8) | IKnowledgeBaseService, IRetrieverService, IResumeEngine, IResumeSpecEngine, IConfidenceService, ICompilerService, IGitHubAnalyzer, IResumeFitService, IChatRepository (port interface) |
| **Services** (4) | RetrieverService, ResumeSpecEngine, ConfidenceService, ResumeFitService |
| **Use Cases** (5) | MemoryUseCases, DraftUseCases, ResumeEngine, ParseUseCases, KBUseCases |
| **Repos** (8) | ExperienceRepo, ProjectRepo, EducationRepo, SkillRepo, CertificateRepo, AchievementRepo, BulletRepo, RawMemoryRepo, DraftRepo |
| **Infrastructure** (4) | KnowledgeBaseLoader, KnowledgeBaseBundle, GitHubAnalyzer, CompilerService |

### 5.3 Constructor Signature Mismatch (Critical)

**ChatUseCases** current constructor:
```typescript
(aiService, chatIntentPrompt, vaultExpanderPrompt, bulletSelectorPrompt)
```

**Required constructor:**
```typescript
(aiService, knowledgeBase, retriever, resumeEngine, chatRepo)
```

This is a complete rewrite — the current class takes prompt strings, the target takes service objects.

---

## 6. Gap Analysis: Frontend

### 6.1 Routes

| Current Route | Verdict | Target |
|---------------|---------|--------|
| `/` | ✅ KEEP | Landing page |
| `/onboarding` | ❌ REMOVE | Handled conversationally in Workspace |
| `/dashboard` + 6 sub-routes | ❌ REMOVE | Replaced by Workspace as primary UI |
| `/profile` | 🔄 REWRITE | → `/memory` (Notion-style browser) |
| `/tailor` | 🔄 REWRITE | → `/workspace` (chat + PDF preview) |
| `/tailor/builder` | ❌ REMOVE (redirect) | Part of `/workspace` |
| `/history` | 🔄 REWRITE | List ResumeDrafts instead of TailoredResumes |
| `/tips` | ❓ TBD | Not in UX spec |
| `/access-denied` | ❓ TBD | Not in UX spec |

### 6.2 Zustand Stores

| Store | Verdict | Notes |
|-------|---------|-------|
| `useChatStore` | 🔄 REWRITE | Merge 5 modes → global single mode. ADD: suggested prompts FSM, input draft persistence (localStorage), MemoryAction handling |
| `useBuilderStore` | ❌ REMOVE | Replaced by draft-centric model + resume-drafts stores |
| `useProfileStore` | ❌ REMOVE | Replaced by memory-store (browser + canonical memory) |
| **—** | 🆕 ADD | `useMemoryStore` — entries, search, pins, counts |
| **—** | 🆕 ADD | `useDraftStore` — draft list, active draft, compile state |

### 6.3 Missing State Features (from UX_SPECIFICATION.md)

9 features described in the UX spec with zero implementation:

1. **Raw Memory vs. Canonical Memory** — Two-layer storage with source attribution
2. **MemoryAction Pattern** — AI proposes → user confirms → backend applies
3. **MergeActions** — AI suggests merges for related entries
4. **Resume Draft Model** — Frozen selections + KB version tracking
5. **Resume Fit Score** — Deterministic ATS coverage computation
6. **System Confidence** — Provenance-based visual confidence bars
7. **Command Menu (Cmd+K)** — Keyboard-navigable command palette
8. **Suggested Prompts State Machine** — Context-aware prompt suggestions
9. **Input Draft Persistence** — localStorage chat input recovery

---

## 7. Cross-Doc Inconsistencies

The following discrepancies exist BETWEEN the documentation files themselves and must be resolved before implementation:

| Issue | Doc A Says | Doc B Says | Recommendation |
|-------|-----------|-----------|----------------|
| **Compile route mount** | SYSTEM_DESIGN.md §3.4: `/api/protected/resume/compile-live` | BACKEND_STRUCTURE.md: `/api/protected/compile/compile-live` | **Follow SYSTEM_DESIGN.md** (higher priority) — keep `/resume/` prefix |
| **Bullet model naming** | SYSTEM_DESIGN.md: `Bullet` | CHANGE_PLAN.md §10: `VaultBullet[]` | **Use `Bullet`** per SYSTEM_DESIGN.md (simpler, consistent with Prisma schema) |
| **ResumeSelection entryType** | CHANGE_PLAN.md §5/N1: includes `"skill"\|"certificate"` | SYSTEM_DESIGN.md §7.3: limited to `"experience"\|"project"\|"education"` | **Use SYSTEM_DESIGN.md** — skills/certs are supporting data, not entry types for selection |
| **Experience source enum** | SYSTEM_DESIGN.md: `"PDF_PARSE"\|"MANUAL"\|"AI_GENERATED"` | CHANGE_PLAN.md §10: adds `"GITHUB"` | **Add `"GITHUB"`** — GitHub import is a primary data source |
| **`pinned` field** | SYSTEM_DESIGN.md: present on all memory models | CHANGE_PLAN.md §10: absent from domain interfaces | **Include `pinned`** per SYSTEM_DESIGN.md — it's essential for the UX spec |
| **compileStatus structure** | SYSTEM_DESIGN.md: flat `compileStatus`, `pdfCacheKey`, `lastCompiledAt` | CHANGE_PLAN.md §11: nested `currentCompile?` + `compileHistory[]` | **Use SYSTEM_DESIGN.md's flat fields** — simpler, no need for compile history yet |
| **ResumeDraft route prefix** | SYSTEM_DESIGN.md: implicit under resume | BACKEND_STRUCTURE.md: `/api/protected/resume-drafts/:id` | **Use BACKEND_STRUCTURE.md's explicit prefix** — cleaner URL structure |
| **IAIService `generate()` method** | BACKEND_STRUCTURE.md: both `generate()` and `generateStructuredData()` | Current code: only `generateStructuredData()` | **ADD `generate()`** to match BACKEND_STRUCTURE.md — needed for KB-context prompt calls |

---

## 8. Phased Migration Plan

The plan follows 8 phases, ordered by dependency:
- **Phase 1** = Foundation (no dependencies on later phases)
- **Phase 8** = Final integration (depends on all earlier phases)

### Phase 1: Shared Types, Domain Entities, and Port Interfaces

**Goal:** Define the contract layer — no implementation, no Prisma, no HTTP.

**Files to create:**
- `shared/index.ts` — EVOLVE: ADD all new types (JDAnalysis, ResumeDraft, ResumeSelection, MemoryAction, MergeAction, EntrySummary, RawMemory, ResumeFit, ChatIntent revised), REMOVE deprecated types
- `core/domain/entities.ts` — EVOLVE: ADD Experience, Project, Education, Skill, Certificate, Achievement, Bullet, RawMemory, ResumeDraft interfaces (plain TS, no Zod)
- `core/domain/repositories.ts` — EVOLVE: ADD IExperienceRepository, IProjectRepository, IEducationRepository, ISkillRepository, ICertificateRepository, IAchievementRepository, IBulletRepository, IResumeDraftRepository, IRawMemoryRepository, IChatRepository. REMOVE old interfaces
- `core/application/ports/knowledge-base.ts` — ADD
- `core/application/ports/retriever.ts` — ADD
- `core/application/ports/resume-engine.ts` — ADD
- `core/application/ports/resume-spec.ts` — ADD
- `core/application/ports/system-confidence.ts` — ADD
- `core/application/ports/compiler.ts` — ADD
- `core/application/ports/github-analyzer.ts` — ADD
- `core/application/ports/resume-fit.ts` — ADD
- `core/application/ports/ai-service.ts` — EVOLVE: ADD `generate()` method to IAIService

**Dependencies:** None
**Risk:** Low — pure type definitions, no runtime impact
**Verification:** `npx tsc --noEmit` passes

### Phase 2: Persistence Layer (Prisma)

**Goal:** New schema + all new repositories + data migration from old Profile JSON.

**Files to create/evolve:**
- `prisma/schema.prisma` — ADD 9 new models, ADD indexes, EVOLVE ChatMessage (remove `widget`/`mode`), STRIP Profile (remove 4 fields)
- `infrastructure/persistence/experience-repository.ts` — ADD
- `infrastructure/persistence/project-repository.ts` — ADD
- `infrastructure/persistence/education-repository.ts` — ADD
- `infrastructure/persistence/skill-repository.ts` — ADD
- `infrastructure/persistence/certificate-repository.ts` — ADD
- `infrastructure/persistence/achievement-repository.ts` — ADD
- `infrastructure/persistence/bullet-repository.ts` — ADD
- `infrastructure/persistence/raw-memory-repository.ts` — ADD
- `infrastructure/persistence/draft-repository.ts` — ADD
- `infrastructure/persistence/chat-repository.ts` — EVOLVE: remove mode column handling, adopt IChatRepository port

**Script:**
- `scripts/migrate-profile-to-domains.ts` — One-time migration of Profile JSON → typed domain entries

**Dependencies:** Phase 1 (domain interfaces + port types)
**Risk:** Medium — existing user data must be migrated without loss. Keep old Profile table as fallback; migration validates each entry before creating.
**Verification:** `npx prisma migrate dev`, run migration script, verify all Profile JSON fields map correctly, `npx tsc --noEmit`

### Phase 3: Business Services (Pure Logic)

**Goal:** Stateless, composable business logic with zero framework imports.

**Files to create:**
- `core/application/services/retriever.ts` — Keyword matching: split JD into keywords, score entries by match count, rank, return EntrySummary[]
- `core/application/services/resume-spec.ts` — Per-template rules: max bullets per section, order, field truncation
- `core/application/services/system-confidence.ts` — Source→confidence map: GitHub=0.99, PDF=0.92, AI=0.75, Manual=1.0
- `core/application/services/resume-fit.ts` — JD skill matching: extract required skills from JD, compute coverage percentage against selected entries

**Dependencies:** Phase 1 (port interfaces, types)
**Risk:** Low — pure functions, no IO. Verifiable via unit tests.
**Verification:** `npm test` for new service tests

### Phase 4: Use Cases (Orchestration)

**Goal:** Wire services + repositories into business transactions.

**Files to create:**
- `core/application/use-cases/memory-use-cases.ts` — ADD: CRUD + search + pin + applyActions
- `core/application/use-cases/draft-use-cases.ts` — ADD: list, get, create, updateSelections, compile, resumeFit
- `core/application/use-cases/resume-engine.ts` — ADD: JD→parse→retrieve→select→spec→draft pipeline
- `core/application/use-cases/parse-use-cases.ts` — ADD: PDF upload→parse→MemoryAction[]
- `core/application/use-cases/kb-use-cases.ts` — ADD: list versions, get bundle info

**Files to rewrite:**
- `core/application/use-cases/chat-use-cases.ts` — REWRITE: global chat, intent classification, MemoryAction flow. New constructor: `(aiService, knowledgeBase, retriever, resumeEngine, chatRepo)`
- `core/application/use-cases/github-use-cases.ts` — REWRITE: deterministic extraction pipeline (analyze → extract → create RawMemory + MemoryAction[])
- `core/application/use-cases/history-use-cases.ts` — REWRITE: operate on ResumeDraft table

**Files to remove:**
- `core/application/use-cases/profile-use-cases.ts` — REMOVE
- `core/application/use-cases/ai-use-cases.ts` — REMOVE
- `core/application/use-cases/resume-use-cases.ts` — REMOVE

**Dependencies:** Phase 2 (repositories) + Phase 3 (services)
**Risk:** Medium — ChatUseCases is the most complex class; the constructor signature change is breaking. The intent classification pipeline (previously monolithic) now delegates to retriever + resumeEngine.
**Verification:** `npm test` passes for rewritten use cases

### Phase 5: API Routes (HTTP Layer)

**Goal:** New route files + rewrites of existing routes + new index.ts mounting.

**Files to create:**
- `interface/routes/memory.ts` — ADD: all 6 Memory CRUD + search routes
- `interface/routes/drafts.ts` — ADD: all 5 Resume Draft CRUD routes
- `interface/routes/compile.ts` — ADD: compile-live, compile-status, compile-result (from drafts)
- `interface/routes/github.ts` — ADD: analyze, import
- `interface/routes/parse.ts` — ADD: PDF upload → parse
- `interface/routes/kb.ts` — ADD: version info

**Files to rewrite:**
- `interface/routes/chat.ts` — REWRITE: single /interact endpoint, MemoryAction[] response, batch /save
- `index.ts` — REWRITE: mount new routes, remove old ones

**Files to remove:**
- `interface/routes/profile.ts` — REMOVE
- `interface/routes/ai.ts` — REMOVE
- `interface/schemas/compile-live.ts` — REMOVE (replaced by draft-based pattern)

**Dependencies:** Phase 4 (use cases)
**Risk:** Medium — canary-deploy new routes alongside old ones to verify no breakage before removing old routes.
**Verification:** Integration tests pass for all new endpoints, `npm test`

### Phase 6: Compiler Pipeline (BullMQ Evolution)

**Goal:** Update queue to work with ResumeDraft IDs instead of in-memory profile objects.

**Files to evolve:**
- `infrastructure/latex/latex-template.ts` — EVOLVE: accept ResumeDraft input instead of Profile
- `infrastructure/queue/pdf-queue.ts` — EVOLVE: accept CompileJob type (draftId + templateId)
- `infrastructure/queue/pdf-worker.ts` — EVOLVE: read ResumeDraft from DB, compile, store PDF result

**Dependencies:** Phase 2 (draft-repository), Phase 4 (draft-use-cases)
**Risk:** Low — existing queue infrastructure is solid; the change is input source only.
**Verification:** Full compile test: create draft → enqueue → worker picks up → PDF returned

### Phase 7: Knowledge Base (Filesystem-Driven Prompts)

**Goal:** Replace `infrastructure/prompts/index.ts` with a filesystem-driven KB system.

**Files to create:**
- `infrastructure/knowledge-base/loader.ts` — ADD: scan `knowledge/` directory at startup, parse .md/.json files, build KnowledgeBundle
- `infrastructure/knowledge-base/bundle.ts` — ADD: KnowledgeBundle type + file discovery + version generation (git hash or timestamp)

**Files to remove:**
- `infrastructure/prompts/index.ts` — REMOVE (all prompts migrated to `knowledge/`)

**Knowledge directory to create:**
```
knowledge/
└── resume/
    ├── prompts/
    │   ├── jd-parser.md              # Extract role, company, skills from JD
    │   ├── bullet-selector.md        # Select best bullets for a given JD
    │   ├── memory-extractor.md       # Extract structured entities from text
    │   ├── entry-expander.md         # Expand brief description into detailed bullets
    │   └── chat-intent-parser.md     # Classify user intent from chat message
    ├── rules/
    │   ├── resume-rules.md           # Max bullets, section order, LaTeX constraints
    │   └── quality-rules.md          # Action verbs, quantified impact, no pronouns
    ├── examples/
    │   └── bullet-examples.md        # Before/after examples for each section
    └── templates/
        └── ats-clean/
            └── rules.json            # Per-template ResumeSpec defaults
```

**Dependencies:** Phase 1 (IKnowledgeBaseService port)
**Risk:** Low — filesystem I/O at startup, no runtime dependency. If KB files are missing, fall back to hardcoded defaults.
**Verification:** Integration test: loader parses all KB files, bundle version is non-empty, getPrompt returns expected content

### Phase 8: Resume Engine + Frontend Integration

**Goal:** Wire the complete frontend experience — Workspace UI, Memory browser, draft management.

**Frontend files to create/rewrite:**
- `src/app/workspace/` — ADD: new workspace page (chat + PDF preview split screen)
- `src/app/memory/` — ADD: memory browser (search-first, Notion-style)
- `src/app/memory/[type]/[id]/` — ADD: memory entry detail/edit page
- `src/app/history/` — REWRITE: list ResumeDrafts instead of TailoredResumes
- `src/components/chat/ChatContainer.tsx` — REWRITE: single-mode, MemoryAction card rendering
- `src/components/chat/widgets/ProposalCard.tsx` — ADD: editable inline proposal cards
- `src/components/chat/widgets/MergeSuggestionCard.tsx` — ADD: merge suggestion UI
- `src/components/memory/MemoryBrowser.tsx` — ADD: search, filter, paginate, pin
- `src/components/memory/MemoryEntryCard.tsx` — ADD: type-specific entry cards
- `src/stores/useChatStore.ts` — REWRITE: global single mode, suggested prompts FSM, input draft persistence
- `src/stores/useMemoryStore.ts` — ADD: entries, search, pins, counts
- `src/stores/useDraftStore.ts` — ADD: draft list, active draft, compile state

**Infrastructure to add:**
- `infrastructure/github/analyzer.ts` — ADD: GitHub API calls for README, languages, commits

**Dependencies:** Phases 1-7 (everything — this is the integration phase)
**Risk:** High — most complex phase. Requires careful frontend state management. The UX spec significantly changes the UI paradigm (no sidebar, command menu, inline proposal cards).
**Verification:** Full end-to-end flow: chat → create memory entry → create resume draft → compile → PDF preview → history

---

## 9. Key Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Data loss during Profile → Domain migration** | High | Keep old Profile table as fallback. Migration validates each entry. New code reads from domain tables; if empty, falls back to Profile. Drop Profile only after all users migrated. |
| **Frontend state management rewrite** | High | Build new stores alongside old ones. Component-level feature flags to switch between old and new paths. Gradual rollout: first workspace/memory pages, then remove old pages. |
| **ChatUseCases constructor breaking change** | High | Old ChatUseCases removed and replaced — no backward compat needed as it's a backend-only class. Verify all callers (chat.ts route file, tests) are updated in same PR. |
| **Cross-doc inconsistencies** | Medium | Documented in §7 above. Resolved before implementation via architect decision. SYSTEM_DESIGN.md takes priority over all others. |
| **Prompt migration to KB files** | Medium | Load KB at startup with fallback to hardcoded prompts if files missing. Compare AI output quality before/after. |
| **Retriever quality too low** | Medium | Start with keyword matching. Add synonym mapping. If quality poor, increase summary length in EntrySummary. Embedding-based search is a future enhancement. |
| **Template → ResumeSpec migration incomplete** | Medium | Map all 4 existing templates manually. Validate constraints are expressible in new rules format. Default spec for any unmapped template. |
| **Workspace performance (chat + live PDF)** | Medium | Debounce compile (800ms as currently implemented). Lazy-load memory browser. Virtual scrolling for long entry lists. |

---

## 10. Approval Gate

### Next Step

This report is the deliverable for the **audit phase**. Implementation should not begin until approval is received.

### To Approve, Please Confirm:

1. **Phase ordering**: 8 phases in the specified dependency order
2. **Priority rule**: SYSTEM_DESIGN.md > BACKEND_STRUCTURE.md > CHANGE_PLAN.md for resolving doc inconsistencies
3. **Migration safety**: Keep old Profile table as fallback; remove only after all users migrated
4. **Frontend scope**: UX_SPECIFICATION.md describes the target, but UI_UX_ARCHITECTURE.md describes current reality — implement UX spec changes in Phase 8
5. **Out of scope**: Embedding search, timeline/audit trail, resume comparison, custom template UI (per CHANGE_PLAN.md §15)

Once approved, Phase 1 (Types, Domain, Ports) can begin immediately.
