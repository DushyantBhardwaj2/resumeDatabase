# Resumint — Product Migration Plan

> **Author:** Lead Product Architect  
> **Status:** Planning Document  
> **Audience:** Engineering team executing the migration  
> **Source of Truth:** Codebase analysis, `TECH_ARCHITECTURE.md`, `UI_UX_ARCHITECTURE.md`, and all source files

---

## Table of Contents

1. [Current Product](#1-current-product)
2. [Target Product](#2-target-product)
3. [Gap Analysis](#3-gap-analysis)
4. [Feature Migration](#4-feature-migration)
5. [New Features](#5-new-features)
6. [Information Architecture](#6-information-architecture)
7. [Screen Inventory](#7-screen-inventory)
8. [AI Context Pipeline](#8-ai-context-pipeline)
9. [Chat Redesign](#9-chat-redesign)
10. [Career Memory](#10-career-memory)
11. [Resume Draft](#11-resume-draft)
12. [Resume Engine](#12-resume-engine)
13. [LaTeX System](#13-latex-system)
14. [AI Responsibilities](#14-ai-responsibilities)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Technical Risks](#16-technical-risks)
17. [What Should Not Change](#17-what-should-not-change)
18. [Design Language](#18-design-language)
19. [Knowledge Base](#19-knowledge-base)
20. [Final Summary](#20-final-summary)
21. [Product Constitution](#21-product-constitution)

---

## 1. Current Product

### What the Product Currently Is

Resumint is an AI-powered resume tailoring web application. Deployed as a monorepo with a Next.js 16 frontend on Vercel and a Hono backend on Render. Users authenticate via Google OAuth (restricted to `@nsut.ac.in` emails), onboard by uploading a PDF resume or chatting with an AI, then tailor resumes to specific job descriptions.

### How Users Currently Think

The user experience is split into two phases:

1. **Profile Creation Phase:** Upload resume → AI parses → review → save as "Career Vault"
2. **Resume Tailoring Phase:** Paste JD → AI selects bullets → toggle → compile PDF

The mental model is: "I put my experience in a vault, I paste a JD, I get a tailored resume PDF."

### What the Current Workflow Is

**Onboarding Flow:**
1. Sign in with Google → redirect to `/onboarding`
2. Chat greeting with upload dropzone widget
3. Upload PDF → `POST /api/protected/resume/parse` → AI extracts structured data
4. Data stored in `useChatStore.extractedData`
5. User types "looks good" → AI returns `NAVIGATE`/`REVIEW`
6. Phase becomes `COMPLETE` → `POST /api/protected/profile` → redirect to `/dashboard`

**Tailoring Flow:**
1. Navigate to `/tailor` → enter job title, company, job description (form fields)
2. `POST /api/protected/resume/tailor` → AI selects matching bullets, generates summary, produces LaTeX
3. Response populates `useBuilderStore` with profile + selections
4. User toggles bullets (all selected by default)
5. `triggerCompile()` → BullMQ → `pdflatex` → PDF blob → preview

**Vault Editing Flow:**
1. Navigate to `/profile`
2. Edit any section
3. Auto-save with 500ms debounce + localStorage draft

### Key Architectural Evidence

- **Chat modes are siloed:** `ONBOARDING`, `BUILDER`, `DASHBOARD`, `TAILOR`, `PROFILE` — each has independent message history
- **AI does everything:** One monolithic `CHAT_INTENT_PARSER` prompt controls intent routing, widget selection, phase transitions, and data extraction
- **Profile is a single JSON blob:** All sections stored as JSON columns in a single `Profile` table row
- **No conversation memory beyond messages:** Chat history is stored but the AI doesn't maintain state
- **No deterministic resume rules:** Bullet limits, section ordering, and layout constraints are hardcoded in template configs
- **Dashboard is hollow:** 6 sub-pages marked "Coming Soon", hardcoded ATS score (82%)
- **Resume is tightly coupled to live profile:** Tailoring reads live profile; changing the profile changes past resumes

---

## 2. Target Product

### Core Philosophy

Resumint is an **AI Career Memory** — not a resume builder.

The product feels like Claude. Users never think "I'm going to the Memory page." They think "I'll ask Resumint."

Memory is not an application page. Memory is something the AI manages on your behalf. Users interact with AI conversationally, and the AI updates memory in the background. The memory browser exists (like Notion, search-first) but users rarely visit it because the AI handles everything through conversation.

**Career Memory is the heart of the product — but it is passive.** It stores everything. It never demands attention. Users only visit it when they want to browse, search, or make manual edits. The rest of the time, the AI manages it silently.

### How Users Feel

- "I completed an internship at Microsoft" → AI extracts Experience, Skills, Achievements, Projects → shows preview → "Save?" → user confirms → done
- "Create a resume for the Senior Frontend role at Google" → user pastes JD → AI analyzes, selects entries, shows preview → "Generate Resume" → compiled PDF
- "What projects used React?" → AI searches memory → shows results inline
- "Update the Microsoft internship end date to December" → AI finds the entry, proposes the change → user confirms → memory updated

The user never navigates to a "Memory" page to add data. They never fill forms. They talk.

### How Resume Creation Feels

The entire experience is conversational, not form-based:

```
User: "Create a resume for this role"

[pastes JD text]

AI: "This looks like a Backend Engineer role at Google. Based on your Career Memory, I'll emphasize:

  ✓ Distributed Systems
  ✓ Java
  ✓ Spring Boot
  ✓ System Design

  I've selected 3 experience entries and 2 projects that are most relevant.
  You can adjust anything before compiling."

[Generate Resume button]

[User clicks → Resume Draft created → PDF compiles → preview appears]
```

The user does not:
- Navigate to a "Tailor" page
- Fill in job title / company / description fields
- Manually toggle checkboxes for every bullet
- Click "Compile" separately

They paste a JD and the AI handles everything. The entire screen feels like Claude — centered chat, minimal chrome.

### The Three-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Career Memory                            │
│  Projects · Experience · Education · Skills · Certificates   │
│  Achievements                                                │
│                                                              │
│  Passive. The AI manages it. Users rarely visit it.          │
│  But it is the heart of the product.                         │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Resume Draft                            │
│                                                              │
│  A snapshot for a specific job. Contains:                    │
│  • JD + JD Analysis                                          │
│  • Selected entry IDs + bullet IDs (frozen references)       │
│  • Template selection                                        │
│  • ResumeSpec (rules applied)                                │
│  • Compile status + compiled PDF                             │
│  • Title (e.g., "Google — Backend Engineer")                 │
│                                                              │
│  Independent of Career Memory. Past drafts never change.     │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Resume                                │
│                                                              │
│  The compiled, downloadable PDF. Immutable once generated.   │
│  Stored as part of the Resume Draft.                         │
└──────────────────────────────────────────────────────────────┘
```

The Resume Draft is the **core object** of the product. It decouples resumes from live Career Memory so past work never changes.

### How the AI Interacts (Context Pipeline)

Every AI interaction follows this pipeline:

```
Conversation History
        │
        ▼
   Intent Classification
        │
        ▼
   Retriever (top 30 relevant entries, keyword-only, no AI)
        │
        ▼
   Knowledge Base (prompts + rules + examples)
        │
        ▼
   AI (single-responsibility prompt)
        │
        ▼
   Structured Action (MemoryAction[] or Selection[])
        │
        ▼
   Backend (validate, apply, compile)
        │
        ▼
   UI (render confirmation cards, previews, PDF)
```

Key properties:
- The retriever is deterministic (keyword matching). No AI cost.
- The AI never receives more than 30 entries. Never the full memory.
- The AI never receives full objects — it receives `{ id, title, keywords, bullet_summary }` only.
- Full objects are fetched by the backend after AI responds.
- Knowledge base context is injected per request type (not all at once).

---

## 3. Gap Analysis

| # | Current State | Desired State | Reason | Priority | Difficulty | Risk |
|---|---|---|---|---|---|---|
| G1 | AI does everything in one monolithic prompt | Single-responsibility prompts with knowledge base context | Blurred boundaries, token waste, unpredictable behavior | Critical | Medium | Medium |
| G2 | AI rewrites bullet text during tailoring | AI returns IDs + confidence scores only | Rewriting breaks traceability, violates determinism | Critical | Medium | Medium |
| G3 | Profile is a flat JSON blob | Separate domain models with unique fields | Each type has unique shape (GitHub URL, GPA, company) | Critical | Low | Medium |
| G4 | AI receives full Career Memory on every interaction | Retriever limits to top 30 entries; AI receives `{ id, title, keywords, bullet_summary }` | Full memory is too expensive and slow | Critical | Medium | Medium |
| G5 | Resume is tightly coupled to live profile | Resume Draft is an independent snapshot | Changing memory should not change past resumes | Critical | Medium | Medium |
| G6 | No Resume Draft object | Resume Draft contains all state for a specific resume | Without it, every resume is coupled to live memory | Critical | Medium | Medium |
| G7 | No deterministic resume rule system | ResumeSpec per template: min/max entries, bullet limits, section order | Hardcoded constraints cannot evolve | High | Medium | Low |
| G8 | No Resume Intelligence / Knowledge Base | `knowledge/resume/` with prompts, rules, examples, quality guidelines | AI needs authoritative reference for consistent quality | High | Low | Low |
| G9 | No structured JD parsing | AI analyzes JD into structured skills, requirements, level | Raw JD text is noisy for reliable selection | High | Low | Low |
| G10 | Chat is mode-siloed | Single global chat with context tags | Mode switching is confusing, breaks conversation flow | Medium | Low | Low |
| G11 | No conversation operations on memory | AI returns `MemoryAction[]`; user confirms via editable proposal cards | Core interaction model for memory management | Critical | Low | Low |
| G12 | GitHub import is README-only | Extract languages, commits, topics, package.json, requirements.txt — all deterministic before AI | README-only misses rich repository metadata | Medium | Low | Low |
| G13 | Dashboard exists with hollow sub-pages | No dashboard. Workspace is the default. | Dashboard is unnecessary abstraction | Low | Low | Low |
| G14 | Memory browser is a form editor | Memory browser is search-first (like Notion) | Users need to find entries, not manage a document | Medium | Medium | Low |
| G15 | Tailor and builder have overlapping state | Single Resume Workspace (chat + preview + selection panel) | Two parallel state machines cause confusion | Medium | Medium | Medium |
| G16 | User sees technical details (IDs, JSON) | Clean Claude-like interface; no technical details exposed | Technical UI erodes trust and feels unfinished | Low | Low | Low |
| G17 | Light theme tokens incomplete | Single dark theme, remove toggle | Broken toggle produces broken UI | Low | Low | Low |

---

## 4. Feature Migration

### F1: User Authentication
- **Decision:** KEEP
- **Why:** BetterAuth + Google OAuth works. Email domain restriction (`@nsut.ac.in`) is a business decision.

### F2: Chat-Driven Onboarding
- **Decision:** MODIFY
- **Why:** Concept is correct. Flow shifts from "create a profile" to "AI builds your Career Memory conversationally."
- **Changes:** Phase transitions become `MemoryAction[]` confirmations. Extract domain-typed entries, not flat profile data.

### F3: PDF Resume Parsing
- **Decision:** MODIFY
- **Why:** Essential. Output creates domain-typed entries (Experience, Project, Education, etc.), not flat profile.
- **Changes:** Parse → `MemoryAction[]` → user confirms → entries saved individually. Old format migrated.

### F4: Dashboard
- **Decision:** DELETE
- **Why:** Hollow abstraction. Users don't need metrics; they need a Workspace.
- **Changes:** Remove `/dashboard` and all sub-pages. `/` redirects to `/workspace`.

### F5: Career Vault / Profile CRUD
- **Decision:** REDESIGN
- **Why:** Current vault is a form editor. Target is a passive, search-first memory browser.
- **Changes:** Rename to "Career Memory." Replace form editor with search + browse. Keep auto-save (well-implemented). Memory is passive — AI handles creation; users browse occasionally.

### F6: Resume Tailoring
- **Decision:** REPLACE
- **Why:** Entire flow is replaced by Resume Draft model.
- **Changes:** Old `/tailor` page becomes `/workspace`. New flow: paste JD → AI analyzes → AI selects (IDs only) → ResumeSpec applied → Draft created → compile. The Resume Draft decouples from live memory.

### F7: Live PDF Compilation
- **Decision:** KEEP
- **Why:** BullMQ + Redis + pdflatex is well-architected. Poll-based status works.
- **Changes:** Compile operates on Resume Draft data, not live profile.

### F8: AI Bullet Generation
- **Decision:** MERGE into Chat
- **Why:** A conversation action. User pastes description → AI creates candidate bullets → user confirms.
- **Changes:** No standalone endpoint. Part of `MemoryAction` flow in chat.

### F9: Vault Expansion (AI)
- **Decision:** MERGE into Chat
- **Why:** Same as F8. A conversation memory creation operation.

### F10: Bullet Selection (AI)
- **Decision:** MODIFY
- **Why:** Returns IDs + confidence. Never rewritten text.
- **Changes:** AI receives `{ id, title, keywords, bullet_summary }` per entry, not full objects. Returns `{ entryId, bulletId, confidence, rank, rationale }`.

### F11: GitHub Repository Import
- **Decision:** REDESIGN
- **Why:** README-only is too weak. Extract all deterministic metadata before AI involvement.
- **Changes:** New pipeline: GitHub API → README, languages, commits, topics, package.json, requirements.txt → deterministic tech stack extraction → AI generates bullets from enriched context → Project entry created.

### F12: Tailoring History
- **Decision:** MODIFY
- **Why:** Becomes Resume Draft History. Stores the draft, not just the PDF.
- **Changes:** Store full `ResumeDraft` object. Add "recompile with same selections" feature.

### F13: Chat History
- **Decision:** MODIFY
- **Why:** Merge mode-siloed histories into global chat.
- **Changes:** Single message list with context tags. Add cleanup cron.

### F14: Dashboard Sub-pages
- **Decision:** DELETE
- **Why:** Dead routes with no purpose.
- **Changes:** Remove all. Route to 404 or redirect.

### F15: Theme Toggle
- **Decision:** DEPRECATE
- **Why:** Only dark mode exists. Broken toggle.
- **Changes:** Remove `ThemeToggle` and `next-themes`. Lock to dark mode.

---

## 5. New Features

### N1: Resume Draft

**Justification:** The core object of the product. Decouples resumes from live Career Memory.

```typescript
interface ResumeDraft {
  id: string
  userId: string
  title: string                        // Auto-generated: "Google — Backend Engineer"
  jobDescription: string
  jdAnalysis?: JDAnalysis              // Structured JD output
  templateId: string
  resumeSpec: ResumeSpec               // Rules applied at creation
  selections: ResumeSelection[]
  compileStatus: "draft" | "queued" | "compiling" | "ready" | "error"
  pdfUrl?: string
  pdfCacheKey?: string                 // Redis key for compiled PDF blob
  lastCompiledAt?: string
  createdAt: string
  updatedAt: string
}

interface ResumeSelection {
  entryType: "experience" | "project" | "education" | "skill" | "certificate"
  entryId: string
  confidence: number
  rank: number
  rationale?: string
  selectedBulletIds: string[]          // Frozen bullet selections
}
```

Key properties:
- Selections store IDs only (frozen references to Career Memory)
- Changing Career Memory does NOT change existing Resume Drafts
- Recompiling with a Resume Draft always produces the same output
- Title is auto-generated from JD analysis

### N2: Resume Workspace

**Justification:** Where users spend 90% of their time. Replaces the old `/tailor` page.

The Workspace contains:
- **Chat panel** (center/left) — conversational JD input, AI responses, selection previews
- **PDF preview** (right) — live compiled PDF, updates on compile
- **Selection panel** (collapsible) — shows what the AI selected, allows adjustments
- **Compile status** — queue → compiling → ready

Users enter the Workspace by clicking "New Resume" or selecting an existing draft from History.

### N3: JD Parser

**Justification:** Raw JD text is too noisy for reliable AI selection.

- AI analyzes JD → extracts required skills, preferred skills, experience level, key responsibilities, term frequency
- Returns structured `JDAnalysis` used by the retriever

### N4: Retriever

**Justification:** Never send full Career Memory to AI. Keyword-only, deterministic, free.

- Given `JDAnalysis`, searches Career Memory using keyword matching on titles, skills, tech stacks, tags
- Returns top 30 entries with relevance scores
- Entries are summarized as `{ id, title, keywords, bullet_summary }` — AI never sees full objects
- Full objects are fetched by the backend after AI selects

### N5: Resume Intelligence Knowledge Base

**Justification:** Authoritative reference the AI consults. Ensures consistently high resume quality.

```
knowledge/
└── resume/
    ├── prompts/
    │   ├── jd-parser.md
    │   ├── bullet-selector.md
    │   ├── memory-extractor.md
    │   └── entry-expander.md
    ├── rules/
    │   ├── bullet-rules.md
    │   ├── section-rules.md
    │   ├── ats-rules.md
    │   └── university-rules.md
    ├── examples/
    │   ├── good-bullets.md
    │   ├── bad-bullets.md
    │   ├── good-resume.md
    │   └── bad-resume.md
    ├── templates/
    │   └── nsut-canonical/
    │       ├── template.tex
    │       └── rules.json
    ├── latex/
    │   └── guidelines.md
    ├── selection/
    │   └── ranking-rules.md
    └── quality/
        ├── faang-resumes.md
        ├── ats-heuristics.md
        ├── harvard-action-verbs.md
        ├── quantified-bullet-patterns.md
        ├── weak-bullet-examples.md
        └── recruiter-notes.md
```

The quality/ directory is a competitive advantage. It encodes years of resume expertise.

### N6: Resume Specification (ResumeSpec)

**Justification:** Template-independent, deterministic rules for resume assembly.

```typescript
interface ResumeSpec {
  sections: {
    experience: { min: number; max: number; maxBullets: number; bulletLength?: number }
    projects: { max: number; maxBullets: number; githubRequired?: boolean }
    education: { max: number; required: boolean }
    skills: { priority: string[]; maxPerGroup: number; max: number }
    certificates: { max: number }
  }
  sectionOrder: string[]
  pageLimit: 1 | 2
}
```

A canonical DSL for resume rules. The backend decides everything. The AI only selects content.

### N7: GitHub Smart Import

**Justification:** README-only misses rich repository metadata.

Pipeline:
1. GitHub API → fetch README, languages, commit count, topics, package.json, requirements.txt
2. Deterministic extraction: parse package.json for dependencies, classify languages, detect framework
3. Build enriched project context (no AI yet)
4. AI generates bullets from enriched context
5. Create Project entry with full source attribution

### N8: Structured Conversation Actions

**Justification:** Core interaction model. AI returns `MemoryAction[]`; frontend renders editable proposal cards.

```typescript
type MemoryAction =
  | { type: "CREATE_EXPERIENCE"; experience: Experience; preview: string }
  | { type: "UPDATE_EXPERIENCE"; id: string; changes: Partial<Experience>; diff: string }
  | { type: "ADD_BULLET"; parentId: string; bullet: VaultBullet }
  | { type: "DELETE_ENTRY"; id: string; type: string }
```

AI never writes to the database. It returns actions. Frontend renders proposal cards (editable, not modals). User confirms, edits, or rejects.

### N9: AI Context Pipeline

**Justification:** The backbone of every AI interaction. Explicitly documents the data flow.

```
User Message
    │
    ▼
1. Conversation History (last 20 messages, sliding window)
    │
    ▼
2. Intent Classification (single-purpose prompt: "is this memory work or resume work?")
    │
    ▼
3. Retriever (deterministic keyword matching, returns top 30 entry summaries)
    │
    ▼
4. Knowledge Base Context (relevant prompts + rules + examples for the intent)
    │
    ▼
5. AI Prompt Assembly (system prompt = KB context + rules + entry summaries)
    │
    ▼
6. AI Response (structured action or selection)
    │
    ▼
7. Backend Validation (Zod schema per action type)
    │
    ▼
8. Application (save to DB, enqueue compile, etc.)
    │
    ▼
9. UI Response (confirmation card, preview, PDF)
```

---

## 6. Information Architecture

### Proposed Structure

```
Resumint
│
├── Unauthenticated
│   ├── Landing Page (/)
│   └── Auth (/auth/*)
│       └── OAuth Redirect (/auth/redirect)
│
├── Authenticated
│   ├── Workspace (/workspace)
│   │   └── The primary screen. Where users spend 90% of their time.
│   │       ├── Chat panel (JD input, AI conversation, selection preview)
│   │       ├── PDF preview panel
│   │       └── Selection panel (collapsible)
│   │
│   ├── Career Memory (/memory)
│   │   ├── Browse by type (Projects, Experience, Education, Skills, Certificates)
│   │   ├── Search (full-text, filter by type)
│   │   └── Entry detail (view/edit single entry)
│   │
│   ├── History (/history)
│   │   └── Past Resume Drafts (list, view, duplicate, recompile, delete)
│   │
│   └── Settings (/settings)
│       ├── Account
│       ├── Preferences
│       └── Export Career Memory
│
└── Global
    └── Chat overlay (accessible from any page, but Workspace is the primary chat)
```

### What Disappeared

- **Dashboard** — Removed
- **Profile** — Renamed to Career Memory, redesigned as search-first browser
- **Tailor** — Replaced by Workspace
- **Tailor Builder** — Absorbed into Workspace
- **All "Coming Soon" pages** — Removed
- **Theme toggle** — Removed. Dark mode only.

### Why This Works

- **Workspace is the default** — users land where they work
- **Career Memory is passive** — it exists, it's browseable, but users rarely visit
- **Chat is the primary interface** — in the Workspace and available globally
- **No dashboard** — removes an unnecessary hop
- **History = Resume Drafts** — not PDF snapshots, but full replicable drafts

---

## 7. Screen Inventory

### S1: Workspace (`/workspace`)

| Aspect | Detail |
|---|---|
| **Purpose** | Primary screen. Where users create resumes. 90% of time spent here. |
| **Main actions** | Chat with AI → paste JD → review AI selection → generate → compile → download |
| **Layout** | Claude-style centered chat (left/center) + PDF preview (right). Collapsible selection panel. |
| **Components** | Chat area, action proposal cards, selection overview, template picker, compile button, PDF preview iframe |
| **AI involvement** | JD parsing, entry selection and ranking, memory creation through conversation |
| **Backend involvement** | `POST /api/protected/chat/interact`, `POST /api/protected/resume-drafts`, compilation endpoints |
| **State** | `useWorkspaceStore` — current draft, chat messages, compile status |
| **Navigation** | Default landing after auth. Sidebar link. |

### S2: Career Memory (`/memory`)

| Aspect | Detail |
|---|---|
| **Purpose** | Browse and search stored Career Memory. Passive — users visit rarely. |
| **Main actions** | Search, filter by type, click entry for detail/edit |
| **Components** | Search bar, type filter chips, entry results list (Notion-style), entry cards |
| **AI involvement** | None (AI manages memory through chat) |
| **Backend involvement** | `GET /api/protected/memory` — list with search, filter, pagination |
| **State** | `useMemoryStore` — entries list, search query, filters |
| **Navigation** | Sidebar → Career Memory |

### S3: Memory Entry Detail (`/memory/:type/:id`)

| Aspect | Detail |
|---|---|
| **Purpose** | View and edit a single memory entry. |
| **Main actions** | Edit fields, add/remove bullets, delete entry |
| **Components** | Type-specific form (Project → GitHub URL + tech stack; Experience → company + dates + location; Education → GPA + courses) |
| **AI involvement** | None (changes come through chat with confirmation) |
| **Backend involvement** | `GET/PATCH/DELETE /api/protected/memory/:type/:id` |
| **State** | `useMemoryStore` — entry detail |

### S4: Resume Draft History (`/history`)

| Aspect | Detail |
|---|---|
| **Purpose** | Browse past Resume Drafts. |
| **Main actions** | Search by title/company, view, duplicate (new draft from old selections), recompile, delete |
| **Components** | Search bar, draft cards (title, date, template, status), action buttons |
| **AI involvement** | None |
| **Backend involvement** | `GET /api/protected/resume-drafts`, `DELETE /api/protected/resume-drafts/:id` |
| **State** | Local state |
| **Navigation** | Sidebar → History |

### S5: Settings (`/settings`)

| Aspect | Detail |
|---|---|
| **Purpose** | Account, preferences, data export. |
| **Main actions** | Edit profile info, set default template/preferences, export Career Memory as JSON |
| **Components** | Settings forms, export button |
| **AI involvement** | None |
| **Backend involvement** | `GET/PATCH /api/protected/settings`, `GET /api/protected/memory/export` |

---

## 8. AI Context Pipeline

This is the backbone of every AI interaction. Every chat message follows this pipeline.

```
User sends message (in Workspace or global chat)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Conversation History                                     │
│     • Last 20 messages (sliding window)                      │
│     • System messages (phase, context) excluded from count   │
│     • If >20, oldest summarized: "Earlier, user added..."    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Intent Classification                                    │
│     • Single-purpose prompt: classify the user's intent      │
│     • Intents:                                               │
│       - CREATE_MEMORY: "I built..." / "I worked at..."      │
│       - UPDATE_MEMORY: "Change my end date..."               │
│       - DELETE_MEMORY: "Remove that project"                 │
│       - CREATE_RESUME: "Create a resume for..."              │
│       - SEARCH_MEMORY: "What projects use React?"            │
│       - GENERAL_CHAT: "What can you do?"                     │
│     • Returns: { intent, confidence, context_hint }          │
│     • No AI cost for GENERAL_CHAT (fast path)               │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Retriever (deterministic, no AI)                          │
│     • If intent = CREATE_RESUME:                             │
│         - Parse JD (if provided) for keywords                 │
│         - Match keywords against memory entry titles,        │
│           skills, tech stacks, tags, bullet text              │
│         - Score: keyword_match * 1.0 + recency_bonus * 0.2   │
│         - Return top 30 entries as summaries                  │
│     • If intent = SEARCH_MEMORY:                              │
│         - Full-text search across all entries                 │
│         - Return top 20 matching entries                      │
│     • If intent = CREATE/UPDATE/DELETE_MEMORY:                │
│         - Skip retriever (no search needed)                   │
│                                                               │
│     Entry summaries are ALWAYS:                               │
│     { id, type, title, keywords: string[],                    │
│       bullet_summary: string (first 80 chars of best bullet), │
│       recency_score: number }                                 │
│     NEVER { full description, all bullets, metadata }         │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Knowledge Base Context                                    │
│     • Loaded from filesystem at startup                       │
│     • Injected based on intent:                               │
│       - CREATE_MEMORY → memory-extractor.md prompt           │
│       - UPDATE_MEMORY → memory-extractor.md + edit rules     │
│       - CREATE_RESUME → jd-parser.md + bullet-selector.md    │
│                        + selection/ranking-rules.md           │
│                        + quality/ relevant excerpts           │
│       - GENERAL_CHAT → conversational guidelines              │
│     • Knowledge base text is included in system prompt        │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Prompt Assembly                                           │
│     System Prompt =                                            │
│       Knowledge Base context (relevant files)                  │
│       + Entry summaries (from retriever, max 30)              │
│       + Output format specification                           │
│       + Constitution principles (short version)               │
│                                                                │
│     User Message = Original user text                          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  6. AI Response                                               │
│     • Structured JSON matching the intent                     │
│     • CREATE_MEMORY → MemoryAction[]                          │
│     • UPDATE_MEMORY → MemoryAction[]                          │
│     • CREATE_RESUME → { selections: Selection[],              │
│                         jdAnalysis: JDAnalysis }              │
│     • SEARCH_MEMORY → { results: EntrySummary[] }             │
│     • GENERAL_CHAT → { reply: string }                        │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Backend Validation                                        │
│     • Validate AI response against Zod schema per type        │
│     • If invalid → retry with stricter prompt (max 2)         │
│     • If still invalid → fallback: "I couldn't process that"  │
│     • If valid → apply:                                       │
│       - MemoryAction[] → save to DB, return confirmation      │
│       - Selection[] → create/update ResumeDraft, enqueue      │
│                       compile, return status + PDF            │
│       - Search results → return to UI                         │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  8. UI Response                                               │
│     • MemoryAction[] → proposal cards (editable, not modals)  │
│     • Selection[] → selection preview + compile button        │
│     • Search results → inline results in chat                 │
│     • Reply text → displayed as assistant message             │
└─────────────────────────────────────────────────────────────┘
```

### Cost Analysis

| Request Type | AI Calls | Tokens (avg) | Cost |
|---|---|---|---|
| GENERAL_CHAT | 1 (short prompt) | ~500 | Lowest |
| CREATE_MEMORY | 1 (KB + action output) | ~2,000 | Low |
| UPDATE_MEMORY | 1 (KB + action output) | ~2,000 | Low |
| SEARCH_MEMORY | 0 (retriever only) + 0-1 (AI formatting) | ~200 | Near-zero |
| CREATE_RESUME | 1 (JD parse) + 1 (selection) | ~4,000 total | Medium |

Compare to current: every `/chat/interact` call sends full chat history + full profile context. The pipeline reduces token usage by 60-80%.

---

## 9. Chat Redesign

### How Chat Changes

**Before:** Chat is mode-siloed with 5 histories. Widget-routed. Phase-driven onboarding.

**After:** Chat is global. No modes. No widgets as a concept. The chat returns structured actions, not UI routing directives.

### What Replaces Widgets

Old widgets (UploadDropzone, DashboardStats, TailorInput) are replaced by:

- **Proposal cards** — Editable preview of what the AI wants to do. Shows new/modiﬁed/deleted content. Buttons: Confirm | Edit | Reject.
- **Selection previews** — When creating a resume, shows what entries the AI selected with confidence bars.
- **Inline search results** — "What projects use React?" → inline cards, not a separate page.

### How the Workspace Chat Differs from Global Chat

The Workspace chat is the **primary** chat. It's always in "resume creation" context. The global chat overlay (accessible from other pages) is for memory management and questions.

In the Workspace, the chat is centered (Claude-style) with a PDF preview on the right. Messages alternate between user text and AI proposal cards.

### How Memory Updates Feel

```
User: "I completed an internship at Microsoft as a SWE intern this summer."

AI: "I've extracted the following from your description. Please review:"

┌─────────────────────────────────────────────────────────┐
│  Experience: Microsoft — SWE Intern                     │
│  ├── Developed features for Azure Cognitive Services    │
│  ├── Reduced API latency by 40% through optimization    │
│  └── Collaborated across 3 cross-functional teams       │
│                                                         │
│  Skills detected: TypeScript, Azure, REST APIs          │
│                                                         │
│  [Save All]  [Edit]  [Reject]                           │
└─────────────────────────────────────────────────────────┘

User: [clicks Save All → entries created in Career Memory]
```

The proposal card is editable. Users can modify bullet text, add/remove skills, change the title — all inline, without leaving the chat.

### How Resume Creation Feels

```
User: "Create a resume for this role"

[pastes JD for Senior Backend Engineer at Stripe]

AI: "I've analyzed the job description. This is a senior backend role requiring:

  Required: Java, Distributed Systems, PostgreSQL, Kafka
  Preferred: Kubernetes, AWS, Microservices

  From your Career Memory, I've selected:

  Experience (3)
  ┌─────────────────────────────────────────────────────────┐
  │  Senior Backend Engineer at Coinbase  ████████░░ 0.92  │
  │  Backend Engineer at Uber             ██████░░░░ 0.78  │
  │  SWE Intern at Microsoft              ████░░░░░░ 0.45  │
  └─────────────────────────────────────────────────────────┘

  Projects (2)
  ┌─────────────────────────────────────────────────────────┐
  │  Distributed Task Queue (Go, Kafka)    ████████░░ 0.88 │
  │  Payment Gateway (Java, Spring)        ██████░░░░ 0.71 │
  └─────────────────────────────────────────────────────────┘

  Skills: Java, Go, Kafka, PostgreSQL, Kubernetes, AWS

  [Select Template: ats-clean ▼]
  [Generate Resume]
```

The user never fills a form. They paste JD → AI responds → click Generate. Done.

### Confirmation Pattern

Every AI-initiated memory change follows this pattern:
1. AI returns `MemoryAction[]` with structured data
2. Frontend renders proposal cards
3. Each card has: Confirm | Edit | Reject
4. Confirm → apply immediately. Reject → dismiss. Edit → inline editing.
5. Bulk operations (importing a resume) have "Save All" / "Reject All"

Confirmation cards are NOT modals. They're inline chat messages that remain in the conversation history. Users can scroll back to see what was accepted.

---

## 10. Career Memory

### Philosophy

Career Memory is the **heart of the product**, but it is **passive**.

It stores everything. It never demands attention. Users rarely visit the memory browser because the AI handles all memory operations through conversation.

When users DO visit the memory browser, it should feel like Notion — search-first, fast, clean. Not a form editor.

### Domain Models (Separate)

Each type has its own schema because each has unique fields. Unification into a generic `MemoryEntry` would require ugly escape hatches.

```typescript
interface Experience {
  id: string
  company: string
  role: string
  startDate: string
  endDate?: string
  current?: boolean
  location?: string
  bullets: VaultBullet[]
  tags: string[]
  source: { type: "PDF_PARSE" | "MANUAL" | "AI_GENERATED" | "GITHUB"; importedAt: string }
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  title: string
  url?: string
  githubUrl?: string
  readme?: string
  languages: string[]          // Deterministic from GitHub API
  topics: string[]             // GitHub topics
  commitCount?: number
  dependencies?: string[]      // From package.json / requirements.txt
  techStack: string[]
  bullets: VaultBullet[]
  tags: string[]
  source: { type: "GITHUB" | "PDF_PARSE" | "MANUAL" | "AI_GENERATED"; importedAt: string; repoUrl?: string }
  createdAt: string
  updatedAt: string
}

interface Education {
  id: string
  school: string
  degree: string
  field?: string
  gpa?: string
  courses?: string[]
  startYear: number
  endYear?: number
  tags: string[]
}

interface Skill {
  id: string
  name: string
  category: "LANGUAGE" | "FRAMEWORK" | "TOOL" | "PLATFORM" | "CONCEPT"
  proficiency?: "BEGINNER" | "INTERMEDIATE" | "EXPERT"
  tags: string[]
}

interface Certificate {
  id: string
  name: string
  issuer: string
  url?: string
  date?: string
  tags: string[]
}

interface Achievement {
  id: string
  title: string
  description: string
  date?: string
  url?: string
  type: "AWARD" | "HACKATHON" | "PUBLICATION" | "VOLUNTEER" | "LEADERSHIP"
  tags: string[]
}
```

### Why Separate Models

- **Experience** has company, location, dates — Project doesn't
- **Project** has GitHub URL, languages, topics, dependencies, commit count — Experience doesn't
- **Education** has GPA, courses, field of study — unique
- **Skill** has proficiency level, category — fundamentally different shape
- **Certificate** has issuer, verification URL — different shape
- **Achievement** has type classification — needs flexibility

The existing Zod schemas in `backend/src/shared/index.ts` already define most of these as separate types. The migration adds fields (tags, source attribution, timestamps) rather than replacing schemas.

### How AI Creates Memory

1. User describes something in chat
2. AI determines the type
3. AI extracts structured fields appropriate to that type
4. AI returns `MemoryAction[]` containing typed objects
5. Frontend renders proposal cards → user confirms
6. Backend saves entries to the appropriate table

### How Users Browse Memory

Search-first, Notion-style:
- Full-text search across all types
- Filter by type (Projects only, etc.)
- Filter by tag
- Sort by recency or title

Results render as cards. Each card shows type badge, title, key metadata, bullet count, recency.

### Entry Detail View

Type-specific form with:
- Fields appropriate to the type
- Bullet list editor (same VaultBullet system — already good)
- Tags editor
- Source attribution (read-only)
- Created/updated timestamps

### What Becomes Immutable

- **Source imports:** Raw text from PDF/GitHub is immutable (stored as reference)
- **AI-generated bullets:** Marked with `isAIGenerated: true`
- **Resume Drafts:** Selections are frozen ID references; changing memory does not change drafts

### What Requires Confirmation

- **AI-initiated creates:** Any new entry proposed by AI
- **AI-initiated deletes:** Any removal of user-created content
- **Bulk operations:** Importing multiple entries from a single source

User-initiated edits in the memory browser do NOT require confirmation beyond normal save.

### GitHub Smart Import

```
GitHub Repo URL
    │
    ▼
1. GitHub API → fetch README, languages, topics, commits
    │
    ▼
2. Parse package.json / requirements.txt / Cargo.toml
    │    (deterministic, no AI)
    ▼
3. Extract dependencies, detect framework, classify language breakdown
    │
    ▼
4. Build enriched context: { readme, languages[], topics[], techStack[], commitCount }
    │
    ▼
5. AI generates bullets from enriched context
    │
    ▼
6. Project entry created with full source attribution
```

---

## 11. Resume Draft

This is the **core object** of the product. It decouples every resume from live Career Memory.

### Why It Exists

Without Resume Drafts:
- Changing Career Memory changes every past resume
- Selections are tied to live data — no reproducibility
- No way to "freeze" a resume for a specific job application

With Resume Drafts:
- Each resume is an independent snapshot
- Past resumes never change when memory is updated
- Recompiling a Draft always produces the same output
- Selections are stored as frozen ID references

### Schema

```typescript
interface ResumeDraft {
  id: string
  userId: string
  title: string                         // Auto-generated: "Google — Backend Engineer"
  jobDescription: string                // Raw JD text
  jdAnalysis?: JDAnalysis              // Structured JD output (immutable once set)
  templateId: string
  resumeSpec: ResumeSpec               // Rules applied at creation (snapshot)
  selections: ResumeSelection[]         // Frozen ID references
  compileHistory: CompileEntry[]        // Past compile attempts
  currentCompile?: {
    status: "queued" | "compiling" | "ready" | "error"
    jobId?: string
    pdfCacheKey?: string
    startedAt?: string
    completedAt?: string
    error?: string
  }
  createdAt: string
  updatedAt: string
}

interface ResumeSelection {
  entryType: "experience" | "project" | "education"
  entryId: string
  confidence: number                    // AI confidence at selection time
  rank: number
  rationale?: string
  selectedBulletIds: string[]           // Frozen — does not update when memory changes
}

interface CompileEntry {
  status: "queued" | "compiling" | "ready" | "error"
  jobId: string
  startedAt: string
  completedAt?: string
  error?: string
}
```

### Lifecycle

```
1. User enters Workspace → chat with AI about a job
2. User pastes JD → AI analyzes → AI selects entries
3. User clicks "Generate Resume"
4. Backend creates ResumeDraft with:
   - JD + JD analysis (frozen)
   - Selected entry IDs + bullet IDs (frozen)
   - Default template + ResumeSpec
   - Status: "draft"
5. Frontend shows draft preview with template picker
6. User picks template → "Compile"
7. Backend enqueues compile → status: "queued" → "compiling" → "ready"
8. PDF cached in Redis, key stored in draft
9. User can recompile = same selections → same output
10. User can duplicate = new draft with same selections → modify
```

### Relationship to Career Memory

Drafts reference memory entries by ID only. If a memory entry is updated or deleted:
- The draft still holds the old ID reference
- Recompiling still produces the same output (selections are frozen)
- The draft displays a "stale" indicator if entries have been modified since creation
- User can "refresh" the draft = re-run AI selection with current memory

---

## 12. Resume Engine

### Overview

```
JD Text
    │
    ▼
[JD Parser] (AI, KB-assisted)
    │  Returns JDAnalysis
    ▼
[Retriever] (deterministic, keyword matching)
    │  Returns top 30 entry summaries
    ▼
[AI Selector] (AI, KB-assisted)
    │  Returns Selection[] (IDs + confidence)
    ▼
[ResumeSpec] (deterministic rules)
    │  Enforces min/max, ordering, limits
    ▼
[Template Filler] (deterministic)
    │  Generates LaTeX
    ▼
[pdflatex] (BullMQ)
    │
    ▼
PDF
```

### JD Parser

Single-purpose prompt. KB-assisted. Returns structured analysis:

```typescript
interface JDAnalysis {
  requiredSkills: string[]
  preferredSkills: string[]
  experienceLevel: "intern" | "entry" | "mid" | "senior" | "lead"
  keyResponsibilities: string[]
  termFrequency: Record<string, number>
  suggestedSectionOrder: string[]
  industry: string                     // "fintech", "healthcare", etc.
  estimatedSalary?: string
}
```

### Retriever

Pure deterministic logic. No AI. Free.

Algorithm:
1. Tokenize JD analysis into search terms (skills + responsibilities + industry)
2. For each memory entry:
   - Match title → score 1.0
   - Match tags → score 0.8 per match
   - Match keywords in bullets → score 0.5 per match
   - Match tech stack → score 0.7 per match
   - Recency bonus: entries < 6 months old → score * 1.2
   - Type preference: for senior roles, experience > projects > education
3. Sort by score, return top 30 as summaries

Entry summaries are ALWAYS: `{ id, type, title, keywords[], bullet_summary, score }`

### AI Selector

Receives JD analysis + 30 entry summaries. Returns selections with confidence.

```
Input:  JDAnalysis + EntrySummary[30] + KB (bullet-selector.md + ranking-rules.md + quality/ excerpts)
Output: Selection[]
```

Each `Selection` contains:
- `entryId` + `entryType`
- `confidence` (0-1)
- `rank` (1-based, ordered by relevance)
- `rationale` (one sentence explaining why this entry matches)
- `selectedBulletIds` (which bullets from this entry to include)

AI NEVER receives full entry objects. Only `{ id, type, title, keywords, bullet_summary }`.

### ResumeSpec (Canonical DSL)

A structured format that the backend uses to enforce resume constraints:

```
resume:
  experience:
    min: 2
    max: 4
    maxBullets: 3
    bulletLength: 120

  projects:
    max: 3
    maxBullets: 3
    githubRequired: false

  education:
    max: 2
    required: true

  skills:
    priority: [languages, frameworks, tools]
    maxPerGroup: 7
    max: 20

  certificates:
    max: 3

  sectionOrder: [experience, projects, education, skills, certificates]
  pageLimit: 1
```

The AI never decides these values. The backend applies them deterministically.

### Selection → Draft Pipeline

```
AI returns Selection[]
    │
    ▼
1. ResumeSpec.filter(selections)
   • Truncate experience to max: 4
   • Truncate bullets per entry to maxBullets: 3
   • Remove entries below confidence threshold (if configured)
   • Reorder sections per sectionOrder
    │
    ▼
2. Backend fetches full entry objects for selected IDs
    │
    ▼
3. Create ResumeDraft with:
   • Frozen selections (entry IDs + bullet IDs)
   • Current ResumeSpec snapshot
   • TemplateId
   • JD + JDAnalysis
    │
    ▼
4. Return draft to frontend for preview
```

### Compilation

ResumeDraft → TemplateFiller.fill(templateId, selectedEntries, resumeSpec) → LaTeX → pdflatex → PDF

The template filler receives pre-filtered entries (already truncated by ResumeSpec). No further processing needed.

---

## 13. LaTeX System

### Current State (KEEP)

The existing LaTeX system is well-architected:
- Placeholder-based template filling (`{{FULL_NAME}}`, `{{EXP_TITLE_1}}`, etc.)
- Templates on filesystem (version-controlled)
- LaTeX escaping for security
- Empty section stripping
- BullMQ + pdflatex for async compilation
- Temp directory cleanup

### Changes

1. **Template filler receives ResumeDraft data** instead of raw profile data. Entries are pre-filtered and truncated by ResumeSpec before reaching the filler.

2. **Template rules.json → ResumeSpec.** Each template ships with a `rules.json` that defines the default `ResumeSpec`. This spec is stored in the ResumeDraft and can be overridden by the user.

3. **No AI involvement.** Templates are never modified by AI. LaTeX is never generated by AI. The compilation pipeline is entirely deterministic.

---

## 14. AI Responsibilities

### AI SHOULD

| Responsibility | Description | Pipeline Step | Priority |
|---|---|---|---|
| Parse JD into structured analysis | Extract skills, requirements, level | JD Parser | Critical |
| Rank memory entries for a resume | Return {entryId, bulletId, confidence}[] | AI Selector | Critical |
| Extract structured data from conversation | Parse user descriptions into typed entries | Chat → MemoryAction | Critical |
| Expand brief descriptions into bullets | Generate candidate bullets from raw text | Chat → MemoryAction | High |
| Import GitHub repos as enriched projects | Generate bullets from enriched repo data | Chat → MemoryAction | High |
| Answer questions about Career Memory | "What projects use React?" | Chat → Search | Medium |
| Suggest memory entries proactively | "Would you like to add this project?" | Chat → MemoryAction | Medium |
| Explain selection rationale | "Why did you choose this bullet?" | Chat → text | Low |

### AI SHOULD NEVER

| Prohibition | Rationale |
|---|---|
| NEVER generate or modify LaTeX | Breaks determinism |
| NEVER decide resume formatting | Formatting = template + ResumeSpec |
| NEVER rewrite bullet text during tailoring | Text must be traceable to source |
| NEVER create content without user confirmation | All memory mutations require confirmation |
| NEVER delete memory without confirmation | User must approve destructive operations |
| NEVER modify user preferences | Preferences are user-controlled |
| NEVER generate fake metrics | Hallucination prevention |
| NEVER modify template rules | Rules define deterministic behavior |
| NEVER receive full Career Memory | Too expensive, slow, unnecessary |
| NEVER receive full entry objects | Receives { id, title, keywords, bullet_summary } only |
| NEVER make up resume rules | Rules come from knowledge base |
| NEVER bypass the structured action system | All memory changes through verified pipeline |
| NEVER expose technical details to users | Clean Claude-like interface |

---

## 15. Implementation Roadmap

### Phase 1: Core Loop (4 weeks)

**Goal:** Working chat-first Career Memory + Resume Draft creation + compilation.

| Week | Deliverable |
|---|---|
| **Week 1** | Knowledge base files created (prompts, rules, examples, quality). AI prompts refactored into single-responsibility prompts (jd-parser, bullet-selector, memory-extractor, entry-expander). Chat becomes global (merge mode-siloed histories, add context tags). |
| **Week 2** | Conversation actions implemented (`MemoryAction[]` response format). Domain-typed CRUD endpoints (Experience, Project, Education, Skill, Certificate, Achievement). Profile → domain types data migration script. Proposal card UI (editable inline confirmation cards). |
| **Week 3** | Resume Draft model + CRUD. ResumeSpec model + evaluation engine. Retriever service (keyword matching, deterministic scoring, entry summary format). JD Parser prompt + endpoint. ResumeSpec defaults per template (migrate existing config.json → rules.json). |
| **Week 4** | Resume Workspace page (chat + PDF preview + collapsible selection panel). End-to-end resume creation flow: paste JD → AI analyzes → retriever → AI selects → spec applies → draft created → compile → PDF preview. History page (list Resume Drafts). |

### Phase 2: Import & Polish (2 weeks)

| Week | Deliverable |
|---|---|
| **Week 5** | GitHub smart import pipeline (README, languages, commits, topics, package.json, deps). PDF upload → memory import via chat. Manual entry creation via chat. Memory browser (search-first, Notion-style UI). Memory entry detail views (type-specific forms). |
| **Week 6** | Navigation restructure (remove dashboard, rename routes, update sidebar). Settings page (account, preferences, export). CSS cleanup (old variable names, remove ThemeToggle). Knowledge base integration verification (all prompts reference KB files). End-to-end testing. Bug fixes. |

### Total: 6 weeks

### What We're NOT Building (Yet)

- Memory timeline / audit trail
- Resume quality engine (scoring, action verb density)
- Proactive AI memory suggestions
- Resume comparison (side-by-side diff)
- Custom template creation UI
- Multiple output formats (plain text, DOCX)
- Collaborative features
- Embedding-based semantic search
- Resume "stale" indicators
- Draft refresh / re-run AI selection

These are additive features that can be layered on later. The 6-week core delivers a working product that embodies the philosophy.

---

## 16. Technical Risks

### Data Migration (Profile JSON → Domain Types)

- **Risk:** Existing user profiles need to be split into typed entries. If migration fails, users lose data.
- **Mitigation:** Keep old `Profile` table as fallback. Migration script creates entries from JSON, validates, and marks Profile as "migrated." New code reads from domain tables; if empty, falls back to Profile. Drop Profile table only after all users migrated.

### AI Response Format Change

- **Risk:** Changing from `{ intent, targetWidget }` to `{ reply, actions: MemoryAction[] }` breaks existing flows.
- **Mitigation:** Frontend handles both formats during transition. Old format maps to no-op. Drop support after 1 release cycle.

### Retriever Quality

- **Risk:** Keyword-based retriever may miss semantically relevant entries (e.g., "distributed systems" vs "microservices").
- **Mitigation:** Start simple. Add common synonym mapping. The AI selector can still catch semantically relevant entries from the keyword matches. Add embedding search later if needed.

### Entry Summary → AI Selection Quality

- **Risk:** AI receives only `{ id, title, keywords, bullet_summary }` — may make poor selections without full context.
- **Mitigation:** The `bullet_summary` field contains the first 80 chars of the strongest bullet. Keywords include tech stack and tags. If quality is poor, increase summary length or add bullet count.

### Template → ResumeSpec Migration

- **Risk:** Existing `config.json` constraints may not map cleanly to `ResumeSpec`.
- **Mitigation:** Map known templates manually. Validate all constraints are expressible. Default spec for unmapped templates.

### Token Costs with Knowledge Base

- **Risk:** Including KB context in every prompt increases token usage per call.
- **Mitigation:** KB context is intent-specific (not all files at once). Typical KB context is 500-1500 tokens. Net savings from entry summaries (vs full objects) far outweighs KB overhead.

---

## 17. What Should Not Change

### Backend — KEEP

| Component | Why |
|---|---|
| Hono framework | Lightweight, fast, well-structured middleware |
| BetterAuth integration | Working auth, session management, rate limiting |
| Protected route middleware | Clean session injection |
| Hexagonal architecture (ports + adapters) | Testable, maintainable |
| Manual DI container | Simple, explicit, no framework overhead |
| Repository pattern | Clean data access separation |
| Prisma ORM | Type-safe, schema migrations |
| BullMQ + Redis for PDF | Robust async queue |
| Rate limiter | Redis-backed, configurable |
| LaTeX compilation pipeline | pdflatex in Docker, temp cleanup, error handling |
| Pino logger | Structured logging, redaction |
| `IAIService` port + `OpenCodeZenAIService` | Generic, testable, swappable |
| Temperature 0 | Deterministic JSON output |
| `extractJson()` helper | Robust JSON extraction from LLM output |

### Frontend — KEEP

| Component | Why |
|---|---|
| Button, Card, Input, Badge, Dialog, Progress | Well-implemented primitives with a11y |
| Splitter | Resizable panel pattern |
| BorderGlow, ChromaGrid | Visual polish |
| Glassmorphism utility classes | Core visual identity |
| Animation system (fade-up, stagger) | Professional feel |
| Error boundaries | Per-route error handling |
| Hono RPC client (`hc`) | Type-safe, cookie forwarding |
| Cookie-based auth | Works with SSR, no token management |
| Sonner toast | Clean notification system |

### Existing Domain Zod Schemas — EVOLVE

The schemas in `backend/src/shared/index.ts` are mostly correct. Changes:
- Add `tags` field to all types
- Add `source` attribution field
- Add `createdAt`/`updatedAt` timestamps
- Add `Achievement` type (extract from existing unused `achievements` JSON field)
- Add `languages`, `topics`, `commitCount`, `dependencies` to Project

### LaTeX Template System — KEEP

Placeholder-based filling, templates on filesystem, LaTeX escaping, empty section stripping — all well-implemented.

---

## 18. Design Language

### Core Principles

| Principle | Description |
|---|---|
| **Claude-style centered chat** | The primary interface is a centered conversation. Not a sidebar chat, not a bottom panel. The chat IS the page. |
| **Dark-first interface** | Dark mode is the default and only mode. No light mode. No theme toggle. |
| **Minimal chrome** | No toolbar, no status bar, no unnecessary navigation. Just the chat + PDF preview. |
| **One primary action per screen** | Every screen has exactly one thing the user should do. Workspace = create a resume. Memory = search. History = browse drafts. |
| **Right-side live PDF preview** | The PDF preview is always on the right, always visible, always updating. Not a separate tab, not a download link. |
| **Conversational AI messages, not robotic** | AI speaks naturally. No bullet-point lists of "options." No technical jargon. "I found 3 relevant projects" not "Selection complete: 3 entries matched." |
| **Editable proposal cards, not modals** | AI-initiated changes appear as inline cards in the chat. They are editable inline. They are NOT modals that block the interface. |
| **Never expose technical details** | Users never see IDs, JSON, confidence scores as numbers, or any technical implementation detail. A confidence score of 0.92 is shown as a visual bar, not a number. |
| **Smooth, fast transitions** | No jarring page loads. Compile → PDF appears in the preview panel. Confirm → entry appears in memory. Everything is seamless. |

### Visual Hierarchy

```
Workspace Layout:

┌─────────────────────────────────────────────────────────┐
│  header (minimal: logo + nav)                           │
├───────────────────────────────┬─────────────────────────┤
│                               │                         │
│     Chat (centered)           │   PDF Preview           │
│                               │   (right panel)         │
│  ┌─────────────────────────┐  │                         │
│  │ User: "Create a resume" │  │  ┌──────────────────┐  │
│  │                         │  │  │                  │  │
│  │ AI: analyzes, shows     │  │  │   (compiled      │  │
│  │     preview card        │  │  │    PDF preview)  │  │
│  │                         │  │  │                  │  │
│  │ [Generate Resume]       │  │  │                  │  │
│  └─────────────────────────┘  │  └──────────────────┘  │
│                               │                         │
│  Chat input (bottom, centered)│                         │
└───────────────────────────────┴─────────────────────────┘
```

### Component Language

- **Proposal Card:** White/glass card with type badge, content preview, action buttons. Editable inline. Used for all AI-proposed changes.
- **Selection Bar:** Horizontal confidence bar (visual only, no number). Green = high, yellow = medium, gray = low.
- **Entry Card:** Compact card showing type icon, title, key metadata, bullet count. Used in search results and selection previews.
- **Status Dot:** Small colored dot for compile status (green = ready, yellow = compiling, red = error, gray = draft).
- **Type Badge:** Colored badge showing entry type (Experience = blue, Project = purple, Skill = green, etc.).

### Interaction Patterns

- **Enter to send** (chat input)
- **Shift+Enter for newline**
- **Click to edit** (proposal cards are editable on click)
- **Escape to dismiss** (proposal cards, selection panel)
- **Right-click on entry** → context menu (edit, delete, view in memory)
- **Drag to reorder** (entries in selection panel, sections in ResumeSpec)

---

## 19. Knowledge Base

### Purpose

The Knowledge Base is the authoritative reference the AI consults for all resume-related tasks. It ensures consistent quality, enforces best practices, and replaces ad-hoc prompt engineering.

### Structure

```
knowledge/
└── resume/
    ├── prompts/
    │   ├── jd-parser.md           — "Extract skills, level, requirements from this JD"
    │   ├── bullet-selector.md     — "Rank these entries against the JD requirements"
    │   ├── memory-extractor.md    — "Extract structured entries from user description"
    │   └── entry-expander.md      — "Expand brief description into detailed bullets"
    │
    ├── rules/
    │   ├── bullet-rules.md        — "Start with action verbs. Use STAR. Quantify impact."
    │   ├── section-rules.md       — "What belongs in Experience vs Projects vs Skills"
    │   ├── ats-rules.md           — "Keyword density, section headers, file format"
    │   └── university-rules.md    — "NSUT-specific conventions, internship formats"
    │
    ├── examples/
    │   ├── good-bullets.md        — "Optimized database queries reducing latency by 60%"
    │   ├── bad-bullets.md         — "Responsible for database" (too vague)
    │   ├── good-resume.md         — Full example of a well-structured resume
    │   └── bad-resume.md          — Full example of common mistakes
    │
    ├── templates/
    │   └── nsut-canonical/
    │       ├── template.tex
    │       └── rules.json
    │
    ├── latex/
    │   └── guidelines.md          — "Use \\textbf{}, not \\textit{}. Avoid \\begin{wrapfigure}."
    │
    ├── selection/
    │   └── ranking-rules.md       — "Prefer recent experience. Prefer named companies."
    │
    └── quality/
        ├── faang-resumes.md        — "What FAANG recruiters look for"
        ├── ats-heuristics.md       — "Keyword placement, section parsing, PDF compatibility"
        ├── harvard-action-verbs.md — "Curated list of strong action verbs by category"
        ├── quantified-bullet-patterns.md — "Patterns for adding metrics: 'X by Y resulting in Z'"
        ├── weak-bullet-examples.md — "Common weak bullets and how to fix them"
        └── recruiter-notes.md      — "Recruiter attention patterns, 6-second scan"

build/
└── (generated at startup)
    └── knowledge-bundle.json       — All files concatenated for runtime injection
```

### How It's Loaded

1. At server startup, read all `.md` files recursively
2. Concatenate into a `knowledge-bundle.json` with file path + content
3. At request time, select relevant files based on intent
4. Inject selected content into system prompt as context

### How It's Updated

- Files are version-controlled in the repository
- Changes require a PR + deploy (no runtime editing)
- This is intentional — knowledge should be deliberate, not ad-hoc

### Competitive Advantage

The quality/ directory is a **moat**. It encodes years of resume expertise that would take competitors months to replicate. It includes:
- Recruiter heuristics from FAANG companies
- Verified action verb lists from Harvard career resources
- ATS parsing patterns (how systems read PDFs, what sections they look for)
- Common weak patterns (trained from thousands of real resumes)
- Industry-specific conventions (finance vs tech vs consulting)

This knowledge is the AI's reference. It doesn't make up rules — it reads them.

---

## 20. Final Summary

### Current Product

Resumint is an AI-powered resume tailor with:
- Chat-driven onboarding → flat Profile → form editing → AI tailoring → PDF
- Well-architected backend (Hono, hexagonal, Prisma, BullMQ)
- Mode-siloed frontend (Next.js, Zustand, custom UI)
- Monolithic AI prompt doing intent routing, data extraction, and content generation
- Resumes tightly coupled to live profile (editing memory changes past resumes)

### Future Product

Resumint is an AI Career Memory that feels like Claude:

- Users talk, AI handles memory. No forms. No mode switching.
- Career Memory is the heart of the product, but it is passive — the AI manages it silently. Users visit the memory browser rarely.
- The core object is the **Resume Draft** — an independent snapshot decoupled from live memory.
- Resume generation is deterministic: JD → JD Parser (AI) → Retriever (deterministic) → AI Selector (IDs only, entry summaries, no full objects) → ResumeSpec → Template → PDF.
- A **Resume Intelligence Knowledge Base** ensures consistent quality. The quality/ directory is a competitive moat.
- The **AI Context Pipeline** governs all AI interactions: Conversation → Intent → Retriever → KB → Prompt → AI → Action → Backend → UI.
- The **Workspace** (chat + PDF preview + selection panel) is where users spend 90% of their time. Claude-style centered chat, minimal chrome, one primary action.
- Memory is search-first (like Notion), not a timeline.
- No dashboard, no metrics, no hollow pages.

### Migration Strategy

**2 phases, 6 weeks:**

| Phase | Weeks | Outcome |
|---|---|---|
| **1 — Core Loop** | 4 | Global chat, conversation actions, domain types, Resume Draft, JD Parser, Retriever, AI Selector (entry summaries), ResumeSpec, Workspace page, History |
| **2 — Import & Polish** | 2 | GitHub smart import, PDF upload, manual entry creation, memory browser (search-first), navigation restructure, settings, knowledge base integration |

**What comes after (not in MVP scope):**
- Timeline / audit trail
- Resume quality scoring
- Proactive AI suggestions
- Resume comparison
- Custom template creation
- Multiple output formats
- Embedding search

### Expected Benefits

1. **Conversational experience:** Users talk, AI handles memory. No forms. No mode switching.
2. **Deterministic resumes:** Same inputs → same output every time. Resume Drafts decouple from live memory.
3. **Lower AI costs:** Retriever limits context. AI receives entry summaries (not full objects). Net token reduction: 60-80%.
4. **Faster compilation:** No AI calls in the compile pipeline.
5. **Consistent quality:** Knowledge base ensures AI follows resume best practices. Quality/ directory is a moat.
6. **Traceability:** Every bullet traceable to its source entry. Resume Drafts store frozen ID references.
7. **Data portability:** Export Career Memory as JSON.
8. **No regressions:** Changing Career Memory never breaks past resumes.

### Major Risks

1. **Data migration:** Splitting flat Profile JSON into typed entries. Mitigated by backward compatibility layer.
2. **AI response format change:** `{ intent, targetWidget }` → `MemoryAction[]`. Mitigated by dual-format support during transition.
3. **Retriever quality:** Keyword matching may miss semantic matches. Mitigated by AI selector compensation + future embedding support.

---

## 21. Product Constitution

> A short, non-negotiable document that every engineer follows. No feature is built if it violates these principles.

### Article 1: AI is an advisor, never the renderer
The AI helps decide WHAT goes on a resume. It NEVER decides HOW it looks. The backend owns all rendering, formatting, and compilation.

### Article 2: Career Memory is the single source of truth
Every piece of professional information lives in Career Memory once. No duplicate storage. Resumes are views over memory — specifically, Resume Drafts are frozen snapshots of those views.

### Article 3: Every resume is deterministic
Given the same Resume Draft (selections + spec + template), the output must be byte-identical every time. No AI involvement in the compile pipeline.

### Article 4: No information is regenerated if it already exists
If a bullet, entry, or skill already exists in Career Memory, the AI does not regenerate it. It references the existing ID.

### Article 5: Every AI mutation requires user confirmation
No AI-initiated create, update, or delete is applied without explicit user confirmation. Confirmation cards are editable inline, not modals.

### Article 6: Templates own layout; AI owns selection only
Templates define structure, formatting, and constraints. AI selects content. These responsibilities never cross.

### Article 7: The backend — not the LLM — is responsible for resume quality
Resume quality comes from deterministic rules (ResumeSpec), validation, structured pipelines, and the knowledge base. The AI is a component, not the quality assurance system.

### Article 8: Every prompt has a single responsibility
No monolithic prompts. Each prompt does one thing (parse JD, select bullets, extract memory, expand entries). Prompts are stored in the knowledge base, not hardcoded.

### Article 9: Users interact primarily through conversation, not forms
The chat interface is the primary interaction model. Forms and browsers exist as secondary interfaces for power users.

### Article 10: The same inputs must always produce the same resume
Reproducibility is non-negotiable. If a user compiles the same Resume Draft twice, they get the same PDF.

### Article 11: Memory is passive, not secondary
Career Memory is the heart of the product. It is not a page users visit — it is the AI's knowledge base. Users interact with it through conversation, not navigation.

### Article 12: The AI never creates fake data
No fabricated metrics, technologies, or experiences. If a user says "I improved performance," the AI asks "by how much?" rather than inventing a number.

### Article 13: The AI never receives full objects
The AI receives `{ id, title, keywords, bullet_summary }`. Full objects are fetched by the backend after AI responds. This saves tokens and enforces the separation between AI selection and backend execution.

### Article 14: Every resume is a Draft
Resumes are always stored as Resume Drafts — independent snapshots with frozen ID references. No resume is ever coupled to live Career Memory. Past resumes must never change when memory is updated.

### Article 15: The AI Context Pipeline governs all interactions
Every AI request follows: Conversation → Intent → Retriever → Knowledge Base → Prompt → AI → Action → Backend → UI. No shortcuts. No ad-hoc prompts.

---

*End of Change Plan — This document serves as the architectural blueprint for engineering execution. All statements are derived from the existing codebase and the Product Constitution principles.*
