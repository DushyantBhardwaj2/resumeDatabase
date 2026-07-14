# Resumint — System Design

> **Author:** Lead Product Architect
> **Status:** Engineering Blueprint
> **Audience:** Engineering team implementing the migration
> **Source:** CHANGE_PLAN.md (product architecture), UX_SPECIFICATION.md (interaction design), codebase analysis

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [API Contract](#3-api-contract)
4. [Retriever Service](#4-retriever-service)
5. [AI Layer](#5-ai-layer)
6. [Knowledge Base System](#6-knowledge-base-system)
7. [Resume Engine](#7-resume-engine)
8. [Template Engine](#8-template-engine)
9. [Compile Pipeline](#9-compile-pipeline)
10. [Database Schema](#10-database-schema)
11. [State Management](#11-state-management)
12. [Caching Strategy](#12-caching-strategy)
13. [Raw Memory & Canonical Memory](#13-raw-memory--canonical-memory)
14. [System Confidence](#14-system-confidence)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Sequence Diagrams](#16-sequence-diagrams)
17. [Prompt Boundaries](#17-prompt-boundaries)
18. [Security & Rate Limiting](#18-security--rate-limiting)
19. [Monitoring & Logging](#19-monitoring--logging)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Vercel)                             │
│                                                                          │
│  Next.js 16 App Router                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Pages                                                           │   │
│  │  /workspace  /memory  /memory/:type/:id  /history  /settings    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Components                                                      │   │
│  │  WorkspaceChat  ResumePanel  ProposalCard  MemoryBrowser        │   │
│  │  CommandMenu  EntryDetail  DraftCard  SuggestedPrompts           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐ │
│  │  Zustand Stores    │  │  UI Primitives     │  │  Auth (Better)   │ │
│  │  useChatStore      │  │  Button, Card,      │  │  Google OAuth    │ │
│  │  useBuilderStore   │  │  Input, Badge,      │  │  Session cookies │ │
│  │  useMemoryStore    │  │  Dialog, Splitter   │  │                  │ │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              │  /api/* proxy
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Render)                              │
│                                                                          │
│  Hono 4.12 + @hono/node-server                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Auth Middleware → /api/protected/* check session                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────┐   │
│  │  Chat Layer    │  │  Memory API    │  │  Resume Engine           │   │
│  │                │  │                │  │                         │   │
│  │  /chat/         │  │  /memory/*    │  │  /resume-drafts/*        │   │
│  │  interact       │  │  /memory/*/id │  │  /resume/compile-live   │   │
│  │                 │  │               │  │  /resume/parse          │   │
│  └───────┬─────────┘  └───────┬───────┘  └───────────┬─────────────┘   │
│          │                    │                      │                  │
│          ▼                    ▼                      ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AI Context Pipeline                                             │   │
│  │                                                                  │   │
│  │  Intent → Retriever → KB Injection → Prompt Assembly → AI Call  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│          │                                                              │
│          ▼                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────┐   │
│  │  Prisma ORM    │  │  BullMQ        │  │  Redis                  │   │
│  │  PostgreSQL    │  │  PDF Queue     │  │  Rate Limiting          │   │
│  │                │  │  pdflatex      │  │  PDF Cache              │   │
│  └────────────────┘  └────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow (Summary)

```
User Input → Next.js → API Proxy → Hono Router → Auth Middleware →
→ Route Handler → AI Pipeline (if needed) → Database → Response → UI
```

---

## 2. Frontend Architecture

### 2.1 Route Map

| Route | Page Component | Layout | Auth Required |
|---|---|---|---|
| `/` | LandingPage | None | No |
| `/auth/*` | AuthRedirect | AuthLayout | No |
| `/workspace` | WorkspacePage | WorkspaceLayout | Yes |
| `/memory` | MemoryPage | MinimalLayout | Yes |
| `/memory/:type/:id` | EntryDetailPage | MinimalLayout | Yes |
| `/history` | HistoryPage | MinimalLayout | Yes |
| `/settings` | SettingsPage | MinimalLayout | Yes |

### 2.2 Component Tree

```
RootLayout (ThemeProvider + Toaster)
├── LandingPage (public)
└── AuthLayout
    ├── WorkspaceLayout
    │   ├── WorkspaceHeader (logo + draft title + avatar + command menu)
    │   ├── WorkspaceChat (centered, max-w-640)
    │   │   ├── MessageList (virtualized, last 50 messages)
    │   │   │   ├── UserMessage
    │   │   │   ├── AIMessage
    │   │   │   ├── ProposalCard (inline, editable)
    │   │   │   ├── SelectionCard (expandable, inline)
    │   │   │   ├── MergeCard
    │   │   │   └── SystemMessage
    │   │   ├── SuggestedPrompts (adaptable chips)
    │   │   └── ChatInput (auto-expand, draft persisted)
    │   ├── ResumePanel (right side)
    │   │   ├── ResumeToolbar (status + zoom + download)
    │   │   ├── ResumeEmpty
    │   │   ├── ResumeCompiling
    │   │   ├── ResumeIframe
    │   │   └── ResumeError
    │   └── CommandMenu (overlay, searchable, keyboard-driven)
    ├── MinimalLayout (used for Memory, History, Settings)
    │   ├── MinimalHeader (logo + page title + avatar)
    │   └── PageContent
    └── Memory components
        ├── MemoryBrowser (search, filters, entry cards)
        ├── EntryCard (compact, clickable)
        └── EntryDetail (type-specific form)
```

### 2.3 State Management (Zustand)

#### useChatStore

| State | Type | Purpose |
|---|---|---|
| `messages` | `ChatMessage[]` | Current conversation (global, not mode-siloed) |
| `isTyping` | `boolean` | AI response loading |
| `typingLabel` | `string` | Descriptive label ("Analyzing JD...") |
| `intent` | `ChatIntent \| null` | Last classified intent |

Actions: `sendMessage()`, `addMessage()`, `setTyping()`, `clearMessages()`

#### useBuilderStore (renamed from useWorkspaceStore)

| State | Type | Purpose |
|---|---|---|
| `activeDraft` | `ResumeDraft \| null` | Current draft being worked on |
| `chatHistory` | `ChatMessage[]` | Last 10 messages from this draft session |
| `pdfUrl` | `string \| null` | Compiled PDF blob URL |
| `compileStatus` | `"idle" \| "queued" \| "compiling" \| "ready" \| "error"` | Compilation state |
| `zoom` | `number` | Resume panel zoom (50-200) |

Actions: `setDraft()`, `triggerCompile()`, `setZoom()`, `updateSelections()`

#### useMemoryStore

| State | Type | Purpose |
|---|---|---|
| `entries` | `MemoryEntry[]` | Current search results |
| `view` | `"recent" \| "pinned" \| "all"` | Current view mode |
| `typeFilter` | `MemoryType \| null` | Type filter (when view=all) |
| `searchQuery` | `string` | Current search query |
| `pinnedIds` | `Set<string>` | Pinned entry IDs |

Actions: `search()`, `setView()`, `setTypeFilter()`, `pinEntry()`, `unpinEntry()`

### 2.4 API Layer

The frontend uses the existing Hono RPC client (`hc` from `hono/client`) with type-safe endpoints. Current implementation already handles cookie forwarding and FormData.

```
import { hc } from "hono/client"
import type { AppType } from "@resumint/shared"

const client = hc<AppType>("/api", { credentials: "include" })
const response = await client.protected.chat.interact.$post({
  json: { message: "..." }
})
```

### 2.5 Key Component Specifications

#### CommandMenu
- Trigger: `Cmd+K`, click logo, `/` in chat
- Searchable: filters all items as user types
- Sections: Recent Drafts, Pages, Actions
- Keyboard: Arrow keys to navigate, Enter to select, Esc to close
- Backdrop: glass overlay with blur

#### ProposedCard (inline chat component)
- Props: `action` (MemoryAction), `onConfirm`, `onEdit`, `onReject`
- States: Default, Editing, Saved, Rejected
- Editing: fields become contenteditable, Cancel/Save buttons appear
- Merge variant: radio buttons for "Create New" vs "Merge Into"

#### ResumePanel
- Props: `draftId`, `selections`, `templateId`
- States: Empty, Compiling, Ready, Error
- Auto-compile: 800ms debounce on selection changes
- Zoom: CSS transform on iframe container
- Download: Creates `<a>` with blob URL + filename

---

## 3. API Contract

### 3.1 Chat

#### `POST /api/protected/chat/interact`

```typescript
// Request
{
  message: string
  activeDraftId?: string   // If user is working on a draft
}

// Response
{
  reply: string
  type: "text" | "proposal-cards" | "selection" | "search-results" | "merge-suggestion"
  actions?: MemoryAction[]
  selections?: Selection[]
  searchResults?: EntrySummary[]
  mergeSuggestion?: MergeAction
}
```

#### `POST /api/protected/chat/save`

```typescript
// Request
{
  messages: { role: "user" | "assistant"; content: string }[]
}
// Response
{ success: true }
```

### 3.2 Career Memory

#### `GET /api/protected/memory`

```typescript
// Query params
{
  search?: string
  view: "recent" | "pinned" | "all"
  type?: "experience" | "project" | "education" | "skill" | "certificate" | "achievement"
  page?: number
  limit?: number
}
// Response
{
  entries: EntrySummary[]
  total: number
  page: number
}
```

#### `GET /api/protected/memory/:type/:id`

```typescript
// Response
// Returns the full object for the given type
{
  entry: Experience | Project | Education | Skill | Certificate | Achievement
}
```

#### `PATCH /api/protected/memory/:type/:id`

```typescript
// Request
{
  changes: Partial<Experience | Project | Education | Skill | Certificate | Achievement>
}
// Response
{ entry: ... }
```

#### `DELETE /api/protected/memory/:type/:id`

```typescript
// Response
{ success: true }
```

#### `GET /api/protected/memory/count`

```typescript
// Response
{ total: number; byType: Record<string, number> }
```

### 3.3 Resume Drafts

#### `POST /api/protected/resume-drafts`

```typescript
// Request
{
  jobDescription: string
  jdAnalysis: JDAnalysis
  selections: ResumeSelection[]
  templateId: string
}
// Response
{ draft: ResumeDraft }
```

#### `GET /api/protected/resume-drafts`

```typescript
// Response
{ drafts: ResumeDraftSummary[] }
```

#### `GET /api/protected/resume-drafts/:id`

```typescript
// Response
{ draft: ResumeDraft }
```

#### `PATCH /api/protected/resume-drafts/:id`

```typescript
// Request
{
  selections?: ResumeSelection[]
  templateId?: string
}
// Response
{ draft: ResumeDraft }
```

#### `DELETE /api/protected/resume-drafts/:id`

```typescript
// Response
{ success: true }
```

### 3.4 Compilation

#### `POST /api/protected/resume/compile-live`

```typescript
// Request
{ draftId: string }
// Response
{ jobId: string }
```

#### `GET /api/protected/resume/compile-status/:jobId`

```typescript
// Response
{ status: "queued" | "compiling" | "ready" | "error" }
```

#### `GET /api/protected/resume/compile-result/:jobId`

```typescript
// Response: raw PDF blob (Content-Type: application/pdf)
```

### 3.5 Resume Parse

#### `POST /api/protected/resume/parse`

```typescript
// Request: multipart/form-data with PDF file
// Response
{ actions: MemoryAction[] }  // One action per extracted entry
```

### 3.6 GitHub Import

#### `POST /api/protected/github/analyze`

```typescript
// Request
{ url: string }
// Response
{
  repo: {
    name: string
    fullName: string
    description?: string
    readme?: string
    languages: Record<string, number>
    topics: string[]
    commitCount: number
    recentCommits: { message: string; date: string }[]
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    license?: string
    stars: number
    forks: number
  }
  analysis: {
    frameworks: { name: string; confidence: number; source: string }[]
    architecture?: string
    techStack: { name: string; confidence: number }[]
  }
}
```

#### `POST /api/protected/github/import`

```typescript
// Request
{ url: string; mergeIntoId?: string }
// Response
{ actions: MemoryAction[] }
```

### 3.7 Knowledge Base

#### `GET /api/protected/kb/version`

```typescript
// Response
{ current: "v2", versions: ["v1", "v2"] }
```

### 3.8 System Confidence

```typescript
// Not an endpoint — computed inline by the backend and attached to relevant responses
interface ConfidenceAttribution {
  field: string           // e.g., "framework", "language", "bullet_text"
  value: string           // e.g., "Gin"
  confidence: number      // 0.0 - 1.0
  source: string          // e.g., "package.json", "README_heuristic"
}
```

---

## 4. Retriever Service

### 4.1 Purpose

The retriever is a **deterministic, no-AI** service that finds relevant Career Memory entries for a given context. It costs nothing to run and guarantees consistent results.

### 4.2 Search Algorithm

```
Input: query terms (from JD analysis or user search)
Output: EntrySummary[] (max 30, sorted by score)

Algorithm:
1. Tokenize query into search terms
2. For each memory entry, compute:
     title_score = count(query_terms ∩ entry.title_terms) * 1.0
     tag_score = count(query_terms ∩ entry.tags) * 0.8
     tech_score = count(query_terms ∩ entry.tech_stack) * 0.7
     bullet_score = count(query_terms ∩ entry.bullet_text_terms) * 0.5
     recency_bonus = entry < 6 months old ? 1.2 : 1.0
     type_boost = (experience for senior role) ? 1.3 : 1.0
     total = (title_score + tag_score + tech_score + bullet_score) * recency_bonus * type_boost
3. Sort by total descending
4. Return top 30 as EntrySummary[]
```

### 4.3 EntrySummary Format

```typescript
interface EntrySummary {
  id: string
  type: "experience" | "project" | "education" | "skill" | "certificate" | "achievement"
  title: string
  keywords: string[]         // Extracted tags + tech stack + skill names
  bulletSummary: string      // First 80 chars of the best bullet
  score: number              // Relevance score (0.0 - 10.0)
  recencyDays: number        // Days since last update
}
```

The AI **never** receives full entry objects — only `EntrySummary[]`.

### 4.4 When It Runs

| Intent | Retriever Behavior |
|---|---|
| `CREATE_RESUME` | Parse JD → extract keywords → search → top 30 |
| `SEARCH_MEMORY` | Use query directly → search → top 20 |
| `CREATE_MEMORY` | Skip (no search needed) |
| `UPDATE_MEMORY` | Skip (target entry is specified by user) |
| `DELETE_MEMORY` | Skip |
| `GENERAL_CHAT` | Skip |

### 4.5 Merge Detection (in Retriever)

When the intent is `CREATE_MEMORY`, the retriever runs a secondary check:

```
1. Extract keywords from the new content
2. Search existing memory for similar entries
3. If mergeScore > 0.7 (title overlap + tech overlap):
     Include a mergeSuggestion flag in the AI context
4. AI decides whether to propose a merge
```

---

## 5. AI Layer

### 5.1 Prompt Architecture

Each prompt is a **single-responsibility** prompt stored in the Knowledge Base. No monolithic prompts.

| Prompt | Responsibility | KB File |
|---|---|---|
| **JD Parser** | Extract structured info from JD text | `prompts/jd-parser.md` |
| **Bullet Selector** | Rank entries against JD requirements | `prompts/bullet-selector.md` |
| **Memory Extractor** | Extract structured entries from conversation | `prompts/memory-extractor.md` |
| **Entry Expander** | Expand brief description into bullets | `prompts/entry-expander.md` |
| **Merge Detector** | Determine if new content belongs with existing | `prompts/merge-detector.md` |
| **Intent Classifier** | Classify user message intent | `prompts/intent-classifier.md` |
| **Skill Extractor** | Extract skills from free text or conversation | `prompts/skill-extractor.md` |

### 5.2 Intent Classification

A lightweight, single-purpose prompt:

```
System:
Classify the user's message into one intent.
Respond with JSON: { intent: string, confidence: number, contextHint?: string }

Intents:
- CREATE_MEMORY: User shares new experience/project
- UPDATE_MEMORY: User wants to change existing entry
- DELETE_MEMORY: User wants to remove entry
- CREATE_RESUME: User wants a resume for a role
- SEARCH_MEMORY: User asks about memory content
- GENERAL_CHAT: Everything else

Rules:
- If the message contains a job description (multi-line text with requirements/skills), prefer CREATE_RESUME
- If the message mentions an existing entry by name and requests a change, prefer UPDATE_MEMORY
- Fast path: GENERAL_CHAT costs nothing — return immediately
```

### 5.3 Output Formats

#### MemoryAction[]

```typescript
type MemoryAction =
  | { type: "CREATE_EXPERIENCE"; experience: Omit<Experience, "id" | "createdAt" | "updatedAt"> }
  | { type: "CREATE_PROJECT"; project: Omit<Project, "id" | "createdAt" | "updatedAt"> }
  | { type: "CREATE_EDUCATION"; education: Omit<Education, "id"> }
  | { type: "CREATE_SKILL"; skill: Omit<Skill, "id"> }
  | { type: "CREATE_CERTIFICATE"; certificate: Omit<Certificate, "id"> }
  | { type: "CREATE_ACHIEVEMENT"; achievement: Omit<Achievement, "id"> }
  | { type: "UPDATE_ENTRY"; id: string; type: string; changes: Record<string, unknown> }
  | { type: "DELETE_ENTRY"; id: string; type: string }
  | { type: "MERGE_INTO"; sourceId: string; targetId: string; targetType: string }
```

#### Selection[]

```typescript
interface Selection {
  entryId: string
  entryType: "experience" | "project" | "education"
  confidence: number
  rank: number
  rationale: string
  selectedBulletIds: string[]
}
```

#### JDAnalysis

```typescript
interface JDAnalysis {
  requiredSkills: string[]
  preferredSkills: string[]
  experienceLevel: "intern" | "entry" | "mid" | "senior" | "lead"
  keyResponsibilities: string[]
  termFrequency: Record<string, number>
  industry: string
}
```

### 5.4 Validation

Every AI response is validated against Zod schemas before being used:

```
AI returns JSON
    |
    v
Zod validation (per response type)
    |
    ├── Valid ──> Continue pipeline
    |
    └── Invalid ──> Retry with stricter prompt (max 2)
                        |
                        ├── Valid ──> Continue
                        |
                        └── Invalid ──> Fallback: "I couldn't process that"
```

### 5.5 AI Service Interface

The existing `IAIService` port is retained. The `OpenCodeZenAIService` implementation uses:

- Model: claude-sonnet-4-20250514 or equivalent
- Temperature: 0 (deterministic output)
- Max tokens: 4096 (response), 8192 (input with KB context)
- Retry: 2 attempts on validation failure
- Timeout: 30s per call

```
interface IAIService {
  generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>
}
```

---

## 6. Knowledge Base System

### 6.1 Directory Structure

```
knowledge/
├── v1/
│   └── resume/
│       ├── prompts/
│       │   ├── jd-parser.md
│       │   ├── bullet-selector.md
│       │   ├── memory-extractor.md
│       │   ├── entry-expander.md
│       │   ├── merge-detector.md
│       │   ├── intent-classifier.md
│       │   └── skill-extractor.md
│       ├── rules/
│       │   ├── bullet-rules.md
│       │   ├── section-rules.md
│       │   ├── ats-rules.md
│       │   └── university-rules.md
│       ├── examples/
│       │   ├── good-bullets.md
│       │   ├── bad-bullets.md
│       │   ├── good-resume.md
│       │   └── bad-resume.md
│       ├── selection/
│       │   └── ranking-rules.md
│       └── quality/
│           ├── faang-resumes.md
│           ├── ats-heuristics.md
│           ├── harvard-action-verbs.md
│           ├── quantified-bullet-patterns.md
│           ├── weak-bullet-examples.md
│           └── recruiter-notes.md
├── v2/
│   └── resume/         ← (future: same structure, evolved content)
└── current -> v1       ← Symlink: which version is live
```

### 6.2 Loading & Injection

```
Server startup:
    |
    v
Read knowledge/current/ recursively
    |
    v
Concatenate into knowledge-bundle.json
    { version: "v1", files: [{ path: "...prompts/jd-parser.md", content: "..." }, ...] }
    |
    v
At request time (per intent):
    |
    v
Select relevant files from the bundle:
    CREATE_RESUME → jd-parser.md + bullet-selector.md + ranking-rules.md + quality/ excerpts
    CREATE_MEMORY → memory-extractor.md + entry-expander.md + bullet-rules.md
    UPDATE_MEMORY → memory-extractor.md
    SEARCH_MEMORY → (no KB needed)
    GENERAL_CHAT → conversational-guidelines.md
    |
    v
Inject into system prompt as context (500-1500 tokens per request)
```

### 6.3 Bundling at Build Time

A build script (`scripts/build-knowledge-bundle.ts`) runs before deployment:

```
1. Read knowledge/current/ recursively
2. Parse .md files, extract frontmatter
3. Generate knowledge-bundle.json
4. Output to backend/src/generated/
5. Imported at runtime by KnowledgeBaseService
```

### 6.4 Versioning

Each Resume Draft records `kbVersion: string`:

```typescript
interface ResumeDraft {
  // ...
  kbVersion: "v1" | "v2"
  // ...
}
```

This ensures:
- Recompiling a draft always uses the same knowledge base version
- KB version upgrades don't break existing drafts
- A/B testing between versions
- Clean migration path: old drafts keep old KB, new drafts use new KB

---

## 7. Resume Engine

### 7.1 Pipeline

```
JD Text
    │
    ▼
┌─────────────────┐
│   JD Parser     │  ← AI + KB (prompts/jd-parser.md + quality/ excerpts)
│   (AI)          │
│                 │
│   Output:       │
│   JDAnalysis    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Retriever     │  ← Deterministic, no AI
│                 │
│   Input:        │
│   JDAnalysis    │
│                 │
│   Output:       │
│   EntrySummary  │
│   [max 30]      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AI Selector   │  ← AI + KB (prompts/bullet-selector.md + selection/ranking-rules.md)
│   (AI)          │
│                 │
│   Input:        │
│   JDAnalysis +  │
│   EntrySummary  │
│   [max 30]      │
│                 │
│   Output:       │
│   Selection[]   │
│   (IDs + conf)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ResumeSpec    │  ← Deterministic rules
│   (Backend)     │
│                 │
│   Filter:       │
│   • Truncate    │
│   • Reorder     │
│   • Validate    │
│                 │
│   Output:       │
│   Filtered IDs  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Draft Creator │  ← Backend
│                 │
│   Fetch full    │
│   objects for   │
│   selected IDs  │
│                 │
│   Create        │
│   ResumeDraft   │
│   with frozen   │
│   references    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Template      │  ← Deterministic
│   Filler        │
│                 │
│   Generate      │
│   LaTeX from    │
│   template +    │
│   entries       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   pdflatex      │  ← BullMQ
│   (BullMQ)      │
│                 │
│   Compile LaTeX │
│   → PDF         │
└────────┬────────┘
         │
         ▼
        PDF
```

### 7.2 ResumeSpec (Canonical DSL)

```typescript
interface ResumeSpec {
  sections: {
    experience: { min: number; max: number; maxBullets: number }
    projects: { max: number; maxBullets: number; githubRequired?: boolean }
    education: { max: number; required: boolean }
    skills: { priority: string[]; maxPerGroup: number; max: number }
    certificates: { max: number }
  }
  sectionOrder: string[]
  pageLimit: 1 | 2
}
```

The AI never decides spec values. The backend applies them deterministically.

### 7.3 Resume Draft Schema

```typescript
interface ResumeDraft {
  id: string
  userId: string
  title: string                                     // Auto-generated: "Google — Backend Engineer"
  jobDescription: string
  jdAnalysis?: JDAnalysis                           // Frozen at creation
  templateId: string
  resumeSpec: ResumeSpec                            // Snapshot at creation
  selections: ResumeSelection[]                     // Frozen ID references
  kbVersion: string                                 // Which KB version produced this
  currentCompile?: CompileStatus
  compileHistory: CompileEntry[]
  createdAt: string
  updatedAt: string
}

interface ResumeSelection {
  entryType: "experience" | "project" | "education"
  entryId: string
  confidence: number
  rank: number
  rationale?: string
  selectedBulletIds: string[]
}

interface CompileStatus {
  status: "queued" | "compiling" | "ready" | "error"
  jobId?: string
  pdfCacheKey?: string
  startedAt?: string
  completedAt?: string
  error?: string
}
```

---

## 8. Template Engine

### 8.1 Current State (KEEP)

The existing LaTeX system is retained:

- Placeholder-based template filling (`{{FULL_NAME}}`, `{{EXP_TITLE_1}}`, etc.)
- Templates stored on filesystem (version-controlled)
- LaTeX escaping for security
- Empty section stripping
- Temp directory cleanup

### 8.2 Changes

1. **Input source**: Template filler reads from ResumeDraft data (not raw profile)
2. **Rules migration**: Template `config.json` → `rules.json` with ResumeSpec defaults
3. **No AI involvement**: Templates never modified by AI. LaTeX never generated by AI.

### 8.3 Template Directory

```
templates/
├── nsut-canonical/
│   ├── template.tex       (placeholder-based)
│   └── rules.json          (default ResumeSpec)
├── ats-clean/
│   ├── template.tex
│   └── rules.json
├── modern/
│   ├── template.tex
│   └── rules.json
└── compact/
    ├── template.tex
    └── rules.json
```

---

## 9. Compile Pipeline

### 9.1 Architecture

```
Frontend               Backend                  BullMQ              Worker
   │                      │                       │                   │
   │ POST /compile-live   │                       │                   │
   │─────────────────────>│                       │                   │
   │                      │                       │                   │
   │ { jobId }            │  Enqueue compile       │                   │
   │<─────────────────────│──────────────────────>│                   │
   │                      │                       │                   │
   │────┐                 │                       │                   │
   │    │ Poll every      │                       │   Pick up job     │
   │    │ 800ms           │                       │──────────────────>│
   │<───┘                 │                       │                   │
   │                      │                       │                   │
   │ GET /compile-status  │                       │                   │
   │─────────────────────>│                       │   Compiling...    │
   │                      │                       │                   │
   │ { status }           │                       │   pdflatex        │
   │<─────────────────────│                       │   temp.tex        │
   │                      │                       │                   │
   │                      │                       │   ────> PDF       │
   │                      │                       │                   │
   │                      │                       │  Store in Redis   │
   │                      │                       │  Update status    │
   │                      │                       │<──────────────────│
   │                      │                       │                   │
   │ GET /compile-status  │                       │                   │
   │─────────────────────>│                       │                   │
   │                      │  Read status          │                   │
   │ { status: "ready" }  │<──────────────────────│                   │
   │<─────────────────────│                       │                   │
   │                      │                       │                   │
   │ GET /compile-result  │                       │                   │
   │─────────────────────>│                       │                   │
   │                      │  Fetch from Redis     │                   │
   │                      │<──────────────────────│                   │
   │<─── PDF blob ────────│                       │                   │
```

### 9.2 BullMQ Queue

```typescript
// Queue definition
const compileQueue = new Queue("resume-compile", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
    timeout: 60000,          // 60s max per compile
  },
})

// Job data
interface CompileJob {
  draftId: string
  kbVersion: string
}

// Worker
const worker = new Worker("resume-compile", async (job) => {
  const { draftId, kbVersion } = job.data
  
  // 1. Fetch draft with frozen selections
  // 2. Fetch full entry objects for selected IDs
  // 3. Apply ResumeSpec filtering
  // 4. Fill template → LaTeX
  // 5. Write temp .tex file
  // 6. Run pdflatex
  // 7. Read output PDF
  // 8. Store in Redis with TTL (1 hour)
  // 9. Update draft compile status
  // 10. Clean up temp files
  // 11. Return { success: true, cacheKey: "..." }
}, { connection: redisConnection })
```

### 9.3 PDF Caching

- Compiled PDFs stored in Redis with 1-hour TTL
- Key format: `pdf:{draftId}:{compileTimestamp}`
- On recompile: new entry created, old entry expired
- Redis cleanup: periodic TTL check

---

## 10. Database Schema

### 10.1 Prisma Models

```prisma
// Auth (BetterAuth managed)
model User { /* ... */ }
model Session { /* ... */ }
model Account { /* ... */ }
model Verification { /* ... */ }

// Career Memory (new domain tables)

model Experience {
  id        String   @id @default(cuid())
  userId    String
  company   String
  role      String
  startDate String
  endDate   String?
  current   Boolean  @default(false)
  location  String?
  bullets   Bullet[]
  tags      String[]
  source    Json     // { type: "PDF_PARSE" | "MANUAL" | "AI_GENERATED", importedAt: DateTime }
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Project {
  id           String   @id @default(cuid())
  userId       String
  title        String
  url          String?
  githubUrl    String?
  readme       String?
  languages    String[]
  topics       String[]
  commitCount  Int?
  dependencies String[]    // From package.json / go.mod / requirements.txt
  techStack    String[]
  bullets      Bullet[]
  tags         String[]
  source       Json
  pinned       Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Education {
  id        String   @id @default(cuid())
  userId    String
  school    String
  degree    String
  field     String?
  gpa       String?
  courses   String[]
  startYear Int
  endYear   Int?
  tags      String[]
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Skill {
  id          String   @id @default(cuid())
  userId      String
  name        String
  category    String   // "LANGUAGE" | "FRAMEWORK" | "TOOL" | "PLATFORM" | "CONCEPT"
  proficiency String?  // "BEGINNER" | "INTERMEDIATE" | "EXPERT"
  tags        String[]
  pinned      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Certificate {
  id        String   @id @default(cuid())
  userId    String
  name      String
  issuer    String
  url       String?
  date      String?
  tags      String[]
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Achievement {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String
  date        String?
  url         String?
  type        String   // "AWARD" | "HACKATHON" | "PUBLICATION" | "VOLUNTEER" | "LEADERSHIP"
  tags        String[]
  pinned      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Bullet {
  id            String   @id @default(cuid())
  text          String
  order         Int
  isAIGenerated Boolean  @default(false)
  parentType    String   // "experience" | "project"
  parentId      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Resume Drafts

model ResumeDraft {
  id            String   @id @default(cuid())
  userId        String
  title         String
  jobDescription String
  jdAnalysis    Json?     // Frozen JDAnalysis
  templateId    String
  resumeSpec    Json      // Frozen ResumeSpec
  selections    Json      // Frozen ResumeSelection[]
  kbVersion     String
  compileStatus String   @default("draft") // "draft" | "queued" | "compiling" | "ready" | "error"
  pdfCacheKey   String?
  lastCompiledAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Raw Memory (immutable)

model RawMemory {
  id        String   @id @default(cuid())
  userId    String
  source    String   // "GITHUB_README" | "PDF_UPLOAD" | "CONVERSATION" | "LINKEDIN"
  content   String   // Raw text content
  metadata  Json     // { repoUrl, fileName, importDate, etc. }
  createdAt DateTime @default(now())
}

// Chat (keep existing, add mode removal)

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  role      String   // "user" | "assistant" | "system"
  content   String
  createdAt DateTime @default(now())
}

// Old Profile table (keep temporarily for migration)

model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  contact   Json?
  education Json?
  experience Json?
  projects  Json?
  skills    Json?
  certificates Json?
  extracurriculars Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 10.2 Migration Plan

```
Phase 1: Create new tables alongside existing Profile
  - Create Career Memory tables (Experience, Project, Education, Skill, Certificate, Achievement, Bullet)
  - Create ResumeDraft table
  - Create RawMemory table
  - Old ChatMessage table updated (remove mode column)

Phase 2: Migrate data
  - Profile JSON → domain-typed entries
  - Old TailoredResume → ResumeDraft
  - Script runs, validates, marks Profile as "migrated"

Phase 3: Drop old tables
  - After all users migrated (verify by checking Profile.migratedAt)
  - Drop Profile table
  - Drop TailoredResume table
  - Drop GitHubRepo table (replaced by RawMemory + Project entries)
```

---

## 11. State Management

### 11.1 Zustand Stores

#### useChatStore

```typescript
interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  typingLabel: string
  lastIntent: ChatIntent | null
  
  // Actions
  sendMessage: (text: string) => Promise<void>
  addMessage: (msg: ChatMessage) => void
  setTyping: (typing: boolean, label?: string) => void
  clearMessages: () => void
}
```

No mode-siloed storage. One global conversation.

#### useBuilderStore

```typescript
interface BuilderState {
  activeDraftId: string | null
  activeDraft: ResumeDraft | null
  pdfUrl: string | null
  compileStatus: "idle" | "queued" | "compiling" | "ready" | "error"
  zoom: number
  
  // Actions
  setDraft: (draft: ResumeDraft) => void
  triggerCompile: () => Promise<void>
  updateSelections: (selections: ResumeSelection[]) => void
  setTemplate: (templateId: string) => void
  setZoom: (zoom: number) => void
  download: () => void
}
```

#### useMemoryStore

```typescript
interface MemoryState {
  entries: MemoryEntry[]
  view: "recent" | "pinned" | "all"
  typeFilter: MemoryType | null
  searchQuery: string
  pinnedIds: string[]
  loading: boolean
  
  // Actions
  search: (query: string) => Promise<void>
  setView: (view: "recent" | "pinned" | "all") => void
  setTypeFilter: (type: MemoryType | null) => void
  pinEntry: (id: string) => Promise<void>
  unpinEntry: (id: string) => Promise<void>
  load: () => Promise<void>
  loadMore: () => Promise<void>
}
```

### 11.2 Cross-store Communication

- `ChatStore.sendMessage()` → if response includes `selections`, updates `BuilderStore.activeDraft`
- `ChatStore.sendMessage()` → if response includes `actions`, no BuilderStore interaction
- `MemoryStore.pinEntry()` → updates `pinnedIds` in local state + backend
- No circular dependencies. Each store is independent.

---

## 12. Caching Strategy

### 12.1 Redis Layers

```
Redis
├── Session cache        (BetterAuth managed)
├── Rate limit counters  (TTL: sliding window)
├── PDF cache            (TTL: 1 hour)
│   └── pdf:{draftId}:{timestamp} → Buffer
├── BullMQ queues        (managed by BullMQ)
│   └── resume-compile
└── KB bundle cache      (TTL: infinite, invalidated on deploy)
    └── knowledge-bundle → JSON
```

### 12.2 Frontend Caching

- **No React Query / SWR** — direct fetch via Hono RPC
- **PDF blob** — in-memory `pdfUrl` (ObjectURL), revoked on new compile or unmount
- **Chat draft** — `localStorage` key `workspace-chat-draft`
- **No persistent state** between sessions (chat loads from backend on mount)

### 12.3 Server-side Caching

- **Knowledge base bundle** — loaded at startup, cached in memory
- **Profile** — fetched fresh per request (no server-side cache to avoid stale data)
- **Memory list** — no cache (near-real-time needed)
- **Compile status** — stored in Redis by BullMQ

---

## 13. Raw Memory & Canonical Memory

### 13.1 Concept

```
Raw Memory (immutable origin)
│
├── GitHub README stored as RawMemory { source: "GITHUB_README" }
├── PDF text stored as RawMemory { source: "PDF_UPLOAD" }
├── Conversation stored as RawMemory { source: "CONVERSATION" }
│
▼
Canonical Memory (structured, curated)
│
├── Project (extracted from GitHub)
├── Experience (extracted from PDF)
├── Skill (extracted from conversation)
│
▼
Resume Draft (frozen snapshot of canonical entries)
```

### 13.2 Source Attribution

Every canonical entry references its raw memory source:

```typescript
// In Experience.source:
{
  type: "GITHUB" | "PDF_PARSE" | "CONVERSATION" | "MANUAL" | "AI_GENERATED"
  rawMemoryId?: string     // Link to RawMemory record
  importedAt: string
  originalText?: string    // The specific text that produced this entry (for traceability)
}
```

### 13.3 Why Two Layers

| Benefit | Explanation |
|---|---|
| Re-import without data loss | Import a GitHub repo again → new raw memory → re-extract with updated KB → compare with existing canonical entries |
| Traceability | Every canonical entry knows exactly which source text produced it |
| "Remove this import" | Delete all canonical entries linked to a specific raw memory ID |
| Confidence computation | Raw source determines confidence (see Section 14) |
| A/B extraction | Import once, extract with v1 and v2 KB → compare quality |

### 13.4 Table

```prisma
model RawMemory {
  id        String   @id @default(cuid())
  userId    String
  source    String   // "GITHUB_README" | "PDF_UPLOAD" | "CONVERSATION" | "LINKEDIN"
  content   String   // Full raw text
  metadata  Json     // { repoUrl, fileName, importedAt, fileSize, pageCount }
  createdAt DateTime @default(now())
}
```

---

## 14. System Confidence

### 14.1 Definition

System Confidence measures **data provenance certainty** — how sure the system is that a given piece of information is correct, based on how it was obtained.

### 14.2 Confidence Table

| Source Type | Base Confidence | Notes |
|---|---|---|
| Manual entry (user typed) | 0.99 | Highest — user entered this directly |
| GitHub API (languages) | 0.99 | Exact API data |
| GitHub API (topics) | 0.99 | Exact API data |
| GitHub API (dependencies from package.json) | 0.95 | File exists, parsed deterministically |
| GitHub API (dependencies from README) | 0.61 | Pattern-matched, not confirmed |
| PDF parse (structured section) | 0.92 | Field found in labeled section (e.g., "Education:") |
| PDF parse (AI inferred) | 0.75 | AI extracted from unstructured text |
| AI from conversation (explicit) | 0.88 | "I worked at Microsoft" → explicit mention |
| AI from conversation (implicit) | 0.82 | "I used React" → skill detection |
| AI from conversation (inferred) | 0.70 | "I built web apps" → inferred tech stack |
| README heuristic (framework) | 0.61 | Pattern-matched from text |
| AI-generated bullet text | 0.70 | AI wrote this from user context |

### 14.3 Computation

Confidence is computed **deterministically** by the backend — no AI involvement:

```typescript
function computeConfidence(source: SourceMetadata): number {
  switch (source.type) {
    case "MANUAL":
      return 0.99
    case "GITHUB_API":
      return source.dataPrecision === "EXACT" ? 0.99
           : source.dataPrecision === "FILE_PARSE" ? 0.95
           : 0.80
    case "PDF_PARSE":
      return source.extractionMethod === "STRUCTURED" ? 0.92
           : 0.75
    case "AI_CONVERSATION":
      return source.explicitness === "EXPLICIT" ? 0.88
           : source.explicitness === "IMPLICIT" ? 0.82
           : 0.70
    case "README_HEURISTIC":
      return 0.61
    case "AI_GENERATED":
      return 0.70
    default:
      return 0.50
  }
}
```

### 14.4 Visualization

- Visual bar: green (≥0.90), amber (≥0.70), gray (<0.70)
- Numeric label on hover only
- Shown next to: framework detection, skill extraction, technology identification
- Never shown for: bullet text, entry titles, user-entered fields

---

## 15. Deployment Architecture

### 15.1 Current (Retained)

| Component | Platform | Details |
|---|---|---|
| Frontend | Vercel | Next.js 16, Turbopack, Server Components |
| Backend | Render | Docker, Hono, @hono/node-server |
| Database | Neon (Supabase) | PostgreSQL, Prisma ORM |
| Redis | Render | BullMQ queue + rate limiting + PDF cache |
| AI API | OpenAI-compatible | OpenCode Zen or OpenAI |

### 15.2 Build & Deploy

```
Frontend (Vercel):
  Build: npm run build (Next.js)
  Deploy: automatic on push to main
  Env: NEXT_PUBLIC_API_URL (backend domain)

Backend (Render):
  Build: docker build . (Dockerfile)
  Deploy: automatic on push to main
  Startup: Build knowledge bundle → start server
  Env: DATABASE_URL, REDIS_URL, AI_API_KEY, etc.
```

### 15.3 Data Export

Users can export their Career Memory as JSON:
- `GET /api/protected/memory/export`
- Returns all entries grouped by type
- Includes source attribution, timestamps, tags
- Format: `{ experiences: [...], projects: [...], skills: [...], ... }`

---

## 16. Sequence Diagrams

### 16.1 Chat → Create Memory

```
User                Frontend             Backend               AI             Database
 │                     │                    │                   │                │
 │ "I worked at..."    │                    │                   │                │
 │────────────────────>│                    │                   │                │
 │                     │ POST /chat/interact│                   │                │
 │                     │───────────────────>│                   │                │
 │                     │                    │                    │                │
 │                     │                    │ Intent classify    │                │
 │                     │                    │──────────────────>│                │
 │                     │                    │ { CREATE_MEMORY } │                │
 │                     │                    │<──────────────────│                │
 │                     │                    │                    │                │
 │                     │                    │ Retriever (skip)   │                │
 │                     │                    │                    │                │
 │                     │                    │ KB: memory-extractor.md          │
 │                     │                    │ Assemble prompt    │                │
 │                     │                    │──────────────────>│                │
 │                     │                    │ MemoryAction[]    │                │
 │                     │                    │<──────────────────│                │
 │                     │                    │                    │                │
 │                     │ { actions, reply } │                   │                │
 │                     │<───────────────────│                    │                │
 │                     │                    │                    │                │
 │  Render cards       │                    │                    │                │
 │<────────────────────│                    │                    │                │
 │                     │                    │                    │                │
 │  User: Save All     │                    │                    │                │
 │────────────────────>│                    │                    │                │
 │                     │ PATCH /memory/*    │                    │                │
 │                     │───────────────────>│                    │                │
 │                     │                    │                    │ Write entry   │
 │                     │                    │                    │──────────────>│
 │                     │                    │                    │                │
 │                     │<─ { success } ─────│                    │                │
 │<─ "✓ Saved" ────────│                    │                    │                │
```

### 16.2 Chat → Create Resume

```
User                Frontend             Backend               AI             Database
 │                     │                    │                   │                │
 │ Paste JD + send    │                    │                   │                │
 │────────────────────>│                    │                   │                │
 │                     │ POST /chat/interact│                   │                │
 │                     │───────────────────>│                   │                │
 │                     │                    │ Intent classify   │                │
 │                     │                    │─────> AI ────────>│                │
 │                     │                    │ { CREATE_RESUME } │                │
 │                     │                    │<──────────────────│                │
 │                     │                    │                    │                │
 │                     │                    │ JD Parser (AI)    │                │
 │                     │                    │─────> AI ────────>│                │
 │                     │                    │<── JDAnalysis ────│                │
 │                     │                    │                    │                │
 │                     │                    │ Retriever          │                │
 │                     │                    │─────> DB ─────────│──────────────>│
 │                     │                    │<── EntrySummary[]─│<──────────────│
 │                     │                    │                    │                │
 │                     │                    │ AI Selector        │                │
 │                     │                    │─────> AI ────────>│                │
 │                     │                    │<── Selection[] ───│                │
 │                     │                    │                    │                │
 │                     │                    │ Apply ResumeSpec   │                │
 │                     │                    │                    │                │
 │                     │ { selections,      │                    │                │
 │                     │   reply }          │                    │                │
 │                     │<───────────────────│                    │                │
 │                     │                    │                    │                │
 │ Render selection    │                    │                    │                │
 │ card with           │                    │                    │                │
 │ Generate Resume btn │                    │                    │                │
 │<────────────────────│                    │                    │                │
 │                     │                    │                    │                │
 │ User: Generate      │                    │                    │                │
 │────────────────────>│                    │                    │                │
 │                     │ POST /resume-drafts│                    │                │
 │                     │───────────────────>│                    │                │
 │                     │                    │ Create draft       │                │
 │                     │                    │──────────────────────>──────────>│
 │                     │                    │                    │                │
 │                     │ POST /compile-live │                    │                │
 │                     │───────────────────>│                    │                │
 │                     │                    │ Enqueue BullMQ     │                │
 │                     │<── { jobId } ──────│                    │                │
 │                     │                    │                    │                │
 │ Poll status         │                    │  [pdflatex worker] │                │
 │ 800ms intervals     │                    │       ...          │                │
 │<───────────────────│                    │                    │                │
 │                     │                    │                    │                │
 │ Status: ready       │                    │                    │                │
 │<────────────────────│                    │                    │                │
 │                     │ GET /compile-result│                    │                │
 │                     │───────────────────>│                    │                │
 │                     │<── PDF blob ───────│                    │                │
 │                     │                    │                    │                │
 │ Render PDF in       │                    │                    │                │
 │ Resume panel        │                    │                    │                │
 │ Show download btn   │                    │                    │                │
```

---

## 17. Prompt Boundaries

### 17.1 What Each Prompt Does

| Prompt Name | Input | Output | KB Context | Max Tokens |
|---|---|---|---|---|
| `intent-classifier` | User message | `{ intent, confidence }` | None | 300 |
| `jd-parser` | JD text | `JDAnalysis` | quality/ excerpts + examples/ | 2000 |
| `bullet-selector` | JDAnalysis + EntrySummary[30] | `Selection[]` | selection/ranking-rules.md + quality/ excerpts | 3000 |
| `memory-extractor` | User message | `MemoryAction[]` | rules/bullet-rules.md + examples/ | 2000 |
| `entry-expander` | Raw description + type | `Bullet[]` | rules/bullet-rules.md + quality/harvard-action-verbs.md | 2000 |
| `merge-detector` | New content + existing entry | `{ shouldMerge: boolean, rationale: string }` | None | 500 |
| `skill-extractor` | Text | `Skill[]` | None | 500 |

### 17.2 What Prompts NEVER Do

| Prohibition | Why |
|---|---|
| NEVER generate LaTeX | Breaks determinism |
| NEVER decide formatting | Template + ResumeSpec own formatting |
| NEVER rewrite bullet text during selection | Must be traceable to source |
| NEVER create entries without confirmation | All mutations require user approval |
| NEVER delete without confirmation | Destructive operations need consent |
| NEVER fake metrics | Hallucination prevention |
| NEVER modify template rules | Rules define deterministic behavior |
| NEVER receive full entry objects | Receives EntrySummary only |
| NEVER receive full Career Memory | Too expensive and slow |
| NEVER make up resume rules | Rules come from knowledge base |
| NEVER bypass structured action system | All changes through verified pipeline |

---

## 18. Security & Rate Limiting

### 18.1 Authentication

- **BetterAuth** + Google OAuth
- Session-based with cookies
- All `/api/protected/*` routes check session
- Rate limiting on auth routes: 20 req/min per IP

### 18.2 Authorization

- All data access scoped to `userId` from session
- No user can access another user's data
- No admin role required (single-user-per-account model)

### 18.3 Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| `/api/protected/chat/interact` | 30 | 1 min |
| `/api/protected/resume/compile-live` | 10 | 1 min |
| `/api/protected/resume/parse` | 5 | 1 min |
| `/api/protected/github/analyze` | 10 | 1 min |
| Other `/api/protected/*` | 60 | 1 min |

### 18.4 Input Validation

- All request bodies validated with Zod schemas
- File uploads: PDF only, max 10MB
- LaTeX escaping: existing implementation retained
- JSON injection: existing `extractJson()` helper retained

---

## 19. Monitoring & Logging

### 19.1 Logging

- **Pino logger** (existing) — structured JSON logging
- Log levels: debug, info, warn, error, fatal
- Redacted fields: `AI_API_KEY`, `DATABASE_URL`, session tokens
- Key events logged: AI calls (latency, tokens, model), compilations (duration, status), auth events

### 19.2 Metrics (Future)

- AI call count per user per day
- Compile duration histogram
- Retriever match rates (entries found vs entries selected)
- Knowledge base injection size
- Error rates per endpoint

### 19.3 Error Tracking

- All AI validation failures logged with full prompt + response
- Compile failures logged with LaTeX output (if available)
- Rate limit hits logged per endpoint
- Client-side errors: caught by Next.js error boundaries, logged to console

---

*End of System Design — This document serves as the engineering blueprint for implementation. All contracts, schemas, and flows are derived from CHANGE_PLAN.md and UX_SPECIFICATION.md.*
