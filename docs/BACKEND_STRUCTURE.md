# Resumint — Backend Structure & Service Interfaces

> **Author:** Lead Product Architect
> **Status:** Implementation Blueprint
> **Purpose:** Define the exact file tree, module boundaries, and service interfaces for the backend migration

---

## Folder Tree

```
backend/src/
├── index.ts                          # Server entry — mounts routes, starts workers, loads KB
├── env-init.ts                       # Environment variable initialization (keep)
├──
├── config/                           # (KEEP) Framework configs
│   ├── auth-client.ts
│   ├── auth.ts
│   └── prisma.ts
│
├── shared/                           # (EVOLVE) Shared Zod schemas + types
│   └── index.ts
│       # ADD: JDAnalysis, ResumeDraft, ResumeSelection, ResumeSpec, ConfidenceAttribution
│       # ADD: MemoryAction, MergeAction, ChatIntent (revised), Selection, ResumeFit
│       # ADD: RawMemory, EntrySummary
│       # KEEP: VaultBullet (evolve with parentType/parentId)
│       # REMOVE: Profile, TailoredOutput, parsedResumeSchema, tailorOutputSchema
│       # REMOVE: SECTION_SCHEMAS, SectionName, BulletCategory
│
├── core/                             # Business logic — no framework imports allowed
│   ├── domain/
│   │   ├── entities.ts               # Domain model interfaces (no Zod, no Prisma)
│   │   │   # ADD: Experience, Project, Education, Skill, Certificate, Achievement
│   │   │   # ADD: Bullet, RawMemory, ResumeDraft
│   │   │   # ADD: JDAnalysis, ResumeSpec, ResumeSelection, CompileStatus
│   │   │   # ADD: EntrySummary, MemoryAction, MergeAction
│   │   │   # KEEP: VaultBullet (migrate to Bullet)
│   │   │   # REMOVE: Profile, Contact, Skills, ExtracurricularItem
│   │   │
│   │   └── repositories.ts           # Repository interface contracts
│   │       # ADD: IMemoryRepository (generic, type-parameterized)
│   │       # ADD: IExperienceRepository, IProjectRepository, etc.
│   │       # ADD: IResumeDraftRepository
│   │       # ADD: IRawMemoryRepository
│   │       # ADD: IBulletRepository
│   │       # ADD: IChatRepository (evolve from existing)
│   │       # KEEP: IChatRepository signature
│   │       # REMOVE: IProfileRepository, ITailoredResumeRepository, IGitHubRepoRepository
│   │
│   └── application/
│       ├── ports/                    # Interface contracts for infrastructure
│       │   ├── ai-service.ts         # (KEEP) IAIService — generate(), generateStructuredData()
│       │   ├── knowledge-base.ts     # ADD: IKnowledgeBaseService — getBundle(), getContext(intent)
│       │   ├── retriever.ts          # ADD: IRetrieverService — search(query, options) → EntrySummary[]
│       │   ├── resume-engine.ts      # ADD: IResumeEngine — createDraft(jd, userId) → ResumeDraft
│       │   ├── resume-spec.ts        # ADD: IResumeSpecEngine — apply(spec, selections) → FilteredSelections
│       │   ├── system-confidence.ts  # ADD: IConfidenceService — compute(source) → number
│       │   ├── template-filler.ts    # (KEEP) ILatexTemplateFiller — fill(template, data) → string
│       │   ├── compiler.ts           # ADD: ICompilerService — compile(draftId) → { jobId }
│       │   ├── pdf-parser.ts         # (KEEP) IPDFParser — parse(buffer) → string
│       │   ├── github-analyzer.ts    # ADD: IGitHubAnalyzer — analyze(url) → RepoAnalysis
│       │   ├── resume-fit.ts         # ADD: IResumeFitService — compute(draftId) → ResumeFitScore
│       │   └── index.ts
│       │
│       ├── services/                 # Pure business logic, stateless, composable
│       │   ├── retriever.ts          # ADD: keyword matching, scoring, merge detection
│       │   ├── resume-spec.ts        # ADD: apply constraints, truncate, reorder
│       │   ├── system-confidence.ts  # ADD: provenance-based confidence computation
│       │   ├── resume-fit.ts         # ADD: JD-skill matching, coverage computation
│       │   └── __tests__/
│       │
│       └── use-cases/                # Orchestration — one per route group
│           ├── chat-use-cases.ts     # REWRITE: global chat, intent pipeline, MemoryAction flow
│           ├── memory-use-cases.ts   # ADD: CRUD for all domain types + search + pin
│           ├── draft-use-cases.ts    # ADD: create draft, duplicate, recompile, refresh
│           ├── resume-engine.ts      # ADD: orchestrate jdParser → retriever → aiSelector → spec → draft
│           ├── github-use-cases.ts   # REWRITE: analyze + deterministic extract + import
│           ├── parse-use-cases.ts    # ADD: PDF upload → parse → MemoryAction[]
│           ├── history-use-cases.ts  # REWRITE: operate on ResumeDraft table
│           ├── kb-use-cases.ts       # ADD: list versions, get bundle info
│           └── __tests__/
│
├── infrastructure/                   # Framework + external dependencies
│   ├── ai/
│   │   └── index.ts                  # (KEEP) OpenCodeZenAIService implements IAIService
│   │
│   ├── knowledge-base/
│   │   ├── loader.ts                 # ADD: read filesystem, build bundle at startup
│   │   ├── bundle.ts                 # ADD: knowledge-bundle.json generation
│   │   └── __tests__/
│   │
│   ├── persistence/
│   │   ├── chat-repository.ts        # EVOLVE: remove mode column, global history
│   │   ├── experience-repository.ts  # ADD: Prisma CRUD for Experience
│   │   ├── project-repository.ts     # ADD: Prisma CRUD for Project
│   │   ├── education-repository.ts   # ADD: Prisma CRUD for Education
│   │   ├── skill-repository.ts       # ADD: Prisma CRUD for Skill
│   │   ├── certificate-repository.ts # ADD: Prisma CRUD for Certificate
│   │   ├── achievement-repository.ts # ADD: Prisma CRUD for Achievement
│   │   ├── bullet-repository.ts      # ADD: Prisma CRUD for Bullet
│   │   ├── raw-memory-repository.ts  # ADD: Prisma CRUD for RawMemory
│   │   ├── draft-repository.ts       # ADD: Prisma CRUD for ResumeDraft
│   │   └── __tests__/
│   │
│   ├── github/
│   │   ├── analyzer.ts               # ADD: GitHub API calls, deterministic extraction
│   │   └── __tests__/
│   │
│   ├── queue/
│   │   ├── redis.ts                  # (KEEP)
│   │   ├── pdf-queue.ts              # (KEEP) evolve to accept CompileJob
│   │   └── pdf-worker.ts             # (KEEP) evolve to read from ResumeDraft
│   │
│   ├── pdf/
│   │   └── index.ts                  # (KEEP) PDFParser implements IPDFParser
│   │
│   ├── latex/
│   │   ├── latex-compiler.ts         # (KEEP)
│   │   ├── latex-template.ts         # (KEEP) evolve to read from ResumeDraft
│   │   ├── templates/
│   │   │   ├── ats-clean/
│   │   │   │   └── ...               # (KEEP)
│   │   │   ├── compact/
│   │   │   ├── modern/
│   │   │   └── nsut-canonical/
│   │   └── __tests__/
│   │
│   ├── rate-limiter.ts               # (KEEP)
│   ├── logger.ts                     # (KEEP)
│   └── profile-utils.ts              # REMOVE (old Profile table migration utility)
│
├── interface/                        # HTTP layer
│   ├── types.ts                      # (KEEP) Hono Variables type (session)
│   │
│   ├── routes/
│   │   ├── chat.ts                   # REWRITE: single /interact endpoint, MemoryAction response
│   │   ├── memory.ts                 # ADD: CRUD + search routes for Career Memory
│   │   ├── drafts.ts                 # ADD: CRUD for Resume Drafts
│   │   ├── compile.ts                # REWRITE: simplified status/result (from drafts)
│   │   ├── github.ts                 # ADD: /analyze, /import endpoints
│   │   ├── parse.ts                  # ADD: PDF upload → parse endpoint
│   │   ├── kb.ts                     # ADD: version info endpoint
│   │   └── __tests__/
│   │
│   └── schemas/
│       └── compile-live.ts           # (KEEP) evolve to accept draftId
│
└── di/
    └── container.ts                  # REWRITE: register all new services + repositories
```

---

## Service Interface Definitions

### 1. `ports/ai-service.ts` (KEEP)

```typescript
export interface IAIService {
  generate(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<string>

  generateStructuredData<T>(
    systemPrompt: string,
    userMessage: string,
    schema: ISchema<T>,
    options?: { maxRetries?: number }
  ): Promise<T>
}

export interface ISchema<T> {
  parse(data: unknown): T
}
```

### 2. `ports/knowledge-base.ts` (ADD)

```typescript
export interface IKnowledgeBaseService {
  /** Get current KB version string (e.g., "v1") */
  getCurrentVersion(): string

  /** Get available KB versions */
  getVersions(): string[]

  /** Get the full knowledge bundle (loaded at startup) */
  getBundle(): KnowledgeBundle

  /** Get context relevant to a specific intent (injected into system prompt) */
  getContext(intent: ChatIntent): { version: string; files: KBFile[] }

  /** Get a single prompt file by name */
  getPrompt(name: string): string | undefined
}

export interface KnowledgeBundle {
  version: string
  files: KBFile[]
  loadedAt: string
}

export interface KBFile {
  path: string           // e.g., "prompts/jd-parser.md"
  content: string
  category: "prompt" | "rule" | "example" | "quality"
}
```

### 3. `ports/retriever.ts` (ADD)

```typescript
export interface IRetrieverService {
  /** Search Career Memory for entries matching the query */
  search(options: RetrieverSearchOptions): Promise<EntrySummary[]>

  /** Check if new content should be merged into existing entries */
  detectMerge(newContent: {
    title: string
    description: string
    techStack: string[]
  }): Promise<MergeDetection | null>
}

export interface RetrieverSearchOptions {
  userId: string
  query: string          // Search terms (from JD analysis or user input)
  types?: MemoryType[]   // Filter by type (default: all)
  maxResults?: number    // Default 30
  excludeIds?: string[]  // Exclude specific entries
  contextHint?: string   // "senior" = boost experience, "intern" = boost education
}

export interface EntrySummary {
  id: string
  type: MemoryType
  title: string
  keywords: string[]
  bulletSummary: string   // First 80 chars of best bullet
  score: number           // Relevance 0.0-10.0
  recencyDays: number
}

export interface MergeDetection {
  shouldSuggest: boolean
  targetEntry: {
    id: string
    title: string
    type: MemoryType
  } | null
  matchScore: number
}
```

### 4. `ports/resume-engine.ts` (ADD)

```typescript
export interface IResumeEngine {
  /** Full pipeline: JD → analysis → retrieve → select → spec → draft */
  createDraft(params: {
    userId: string
    jobDescription: string
  }): Promise<ResumeEngineResult>

  /** Refresh an existing draft with current memory (re-run AI selection) */
  refreshDraft(draftId: string): Promise<ResumeEngineResult>
}

export interface ResumeEngineResult {
  draft: ResumeDraft
  jdAnalysis: JDAnalysis
  selections: ResumeSelection[]
  resumeFit?: ResumeFitScore
}
```

### 5. `ports/resume-spec.ts` (ADD)

```typescript
export interface IResumeSpecEngine {
  /** Apply ResumeSpec constraints to raw AI selections */
  apply(spec: ResumeSpec, selections: ResumeSelection[]): FilteredSelections

  /** Get the default ResumeSpec for a template */
  getDefaultSpec(templateId: string): ResumeSpec
}

export interface FilteredSelections {
  experience: ResumeSelection[]    // Truncated to spec.experience.max
  projects: ResumeSelection[]      // Truncated to spec.projects.max
  education: ResumeSelection[]     // Truncated to spec.education.max
  sectionOrder: string[]           // Reordered per spec.sectionOrder
}
```

### 6. `ports/system-confidence.ts` (ADD)

```typescript
export interface IConfidenceService {
  /** Compute system confidence for a piece of data based on its source */
  compute(source: ConfidenceSource): number

  /** Get a human-readable label for a confidence level */
  getLabel(confidence: number): "high" | "medium" | "low"

  /** Get the color class for a confidence level */
  getColor(confidence: number): "green" | "amber" | "gray"
}

export interface ConfidenceSource {
  type: "MANUAL" | "GITHUB_API" | "PDF_PARSE" | "AI_CONVERSATION" | "README_HEURISTIC" | "AI_GENERATED"
  dataPrecision?: "EXACT" | "FILE_PARSE" | "HEURISTIC"
  extractionMethod?: "STRUCTURED" | "INFERRED"
  explicitness?: "EXPLICIT" | "IMPLICIT" | "INFERRED"
}
```

### 7. `ports/compiler.ts` (ADD)

```typescript
export interface ICompilerService {
  /** Enqueue a compile job for a Resume Draft */
  compile(draftId: string): Promise<{ jobId: string }>

  /** Get compile status */
  getStatus(jobId: string): Promise<CompileStatus>

  /** Get compiled PDF blob */
  getResult(jobId: string): Promise<Buffer | null>
}
```

### 8. `ports/github-analyzer.ts` (ADD)

```typescript
export interface IGitHubAnalyzer {
  /** Fetch and analyze a GitHub repository (deterministic, no AI) */
  analyze(url: string): Promise<RepoAnalysis>
}

export interface RepoAnalysis {
  name: string
  fullName: string
  description: string | null
  readme: string
  languages: Record<string, number>       // language → bytes
  topics: string[]
  commitCount: number
  recentCommits: { message: string; sha: string; date: string }[]
  packageJson?: Record<string, unknown>
  goMod?: string
  requirementsTxt?: string
  license: string | null
  stars: number
  forks: number

  // Derived (deterministic)
  frameworks: { name: string; confidence: number; source: string }[]
  techStack: { name: string; confidence: number; source: string }[]
  detectedArchitecture?: string
}
```

### 9. `ports/resume-fit.ts` (ADD)

```typescript
export interface IResumeFitService {
  /** Compute resume-JD match score and breakdown */
  compute(draftId: string): Promise<ResumeFitScore>
}

export interface ResumeFitScore {
  overall: number                        // 0-100
  matched: { skill: string; source: string }[]
  missing: { skill: string }[]
  breakdown: {
    required: { matched: number; total: number; percentage: number }
    preferred: { matched: number; total: number; percentage: number }
  }
}
```

---

## Use Case Signatures

### chat-use-cases.ts (REWRITE)

```typescript
export class ChatUseCases {
  constructor(
    private aiService: IAIService,
    private knowledgeBase: IKnowledgeBaseService,
    private retriever: IRetrieverService,
    private resumeEngine: IResumeEngine,
    private chatRepo: IChatRepository,
  ) {}

  async interact(params: {
    userId: string
    message: string
    activeDraftId?: string
  }): Promise<ChatInteractResponse> {
    // 1. Save user message
    // 2. Classify intent (AI)
    // 3. If CREATE_RESUME: run JD parser → retriever → AI selector → return selections
    // 4. If CREATE_MEMORY: run retriever (merge detection) → memory extractor → return MemoryAction[]
    // 5. If SEARCH_MEMORY: run retriever → return results
    // 6. If GENERAL_CHAT: return text reply (no AI call for simple queries)
    // 7. Save assistant response
    // 8. Return structured response
  }
}
```

### memory-use-cases.ts (ADD)

```typescript
export class MemoryUseCases {
  constructor(
    private repos: {
      experience: IExperienceRepository
      project: IProjectRepository
      education: IEducationRepository
      skill: ISkillRepository
      certificate: ICertificateRepository
      achievement: IAchievementRepository
    },
    private confidence: IConfidenceService,
  ) {}

  async search(params: { userId: string; query?: string; view: "recent" | "pinned" | "all"; type?: MemoryType; page: number; limit: number }): Promise<SearchResult> {}
  async getEntry(type: MemoryType, id: string): Promise<MemoryEntry> {}
  async updateEntry(type: MemoryType, id: string, changes: Record<string, unknown>): Promise<MemoryEntry> {}
  async deleteEntry(type: MemoryType, id: string): Promise<void> {}
  async pinEntry(type: MemoryType, id: string): Promise<void> {}
  async unpinEntry(type: MemoryType, id: string): Promise<void> {}
  async getCount(userId: string): Promise<{ total: number; byType: Record<string, number> }> {}
  async exportAll(userId: string): Promise<ExportedMemory> {}
  async applyActions(userId: string, actions: MemoryAction[]): Promise<AppliedActionResult[]> {}
}
```

### draft-use-cases.ts (ADD)

```typescript
export class DraftUseCases {
  constructor(
    private draftRepo: IResumeDraftRepository,
    private resumeEngine: IResumeEngine,
    private compiler: ICompilerService,
    private resumeFit: IResumeFitService,
  ) {}

  async list(userId: string, filters?: { search?: string; status?: string }): Promise<ResumeDraftSummary[]> {}
  async get(draftId: string): Promise<ResumeDraft> {}
  async create(params: { userId: string; jd: string; jdAnalysis: JDAnalysis; selections: ResumeSelection[]; templateId: string }): Promise<ResumeDraft> {}
  async updateSelections(draftId: string, selections: ResumeSelection[]): Promise<ResumeDraft> {}
  async setTemplate(draftId: string, templateId: string): Promise<ResumeDraft> {}
  async duplicate(draftId: string): Promise<ResumeDraft> {}
  async delete(draftId: string): Promise<void> {}
  async compile(draftId: string): Promise<{ jobId: string }> {}
  async compileStatus(jobId: string): Promise<CompileStatus> {}
  async compileResult(jobId: string): Promise<Buffer | null> {}
  async resumeFit(draftId: string): Promise<ResumeFitScore> {}
}
```

---

## DI Container Structure (REWRITE)

```typescript
class Container {
  // ── Services (pure business logic) ──
  private _retriever?: RetrieverService
  private _resumeSpec?: ResumeSpecEngine
  private _confidence?: ConfidenceService
  private _resumeFit?: ResumeFitService

  // ── Use Cases ──
  private _chatUseCases?: ChatUseCases
  private _memoryUseCases?: MemoryUseCases
  private _draftUseCases?: DraftUseCases
  private _resumeEngine?: ResumeEngine
  private _githubUseCases?: GithubUseCases
  private _parseUseCases?: ParseUseCases
  private _kbUseCases?: KnowledgeBaseUseCases
  private _historyUseCases?: HistoryUseCases

  // ── Infrastructure ──
  private _aiService?: IAIService
  private _kbService?: IKnowledgeBaseService
  private _compiler?: ICompilerService
  private _gitHubAnalyzer?: IGitHubAnalyzer
  private _templateFiller?: ILatexTemplateFiller
  private _pdfParser?: IPDFParser

  // ── Repositories ──
  private _chatRepo?: IChatRepository
  private _experienceRepo?: IExperienceRepository
  private _projectRepo?: IProjectRepository
  private _educationRepo?: IEducationRepository
  private _skillRepo?: ISkillRepository
  private _certificateRepo?: ICertificateRepository
  private _achievementRepo?: IAchievementRepository
  private _draftRepo?: IResumeDraftRepository
  private _rawMemoryRepo?: IRawMemoryRepository

  // ── Getters follow same pattern as current container ──
  get chatUseCases() {
    if (!this._chatUseCases) {
      this._chatUseCases = new ChatUseCases(
        this.aiService,
        this.knowledgeBase,
        this.retriever,
        this.resumeEngine,
        this.chatRepo,
      )
    }
    return this._chatUseCases
  }

  // ... (all other getters follow this pattern)
}
```

---

## Migration: Files to CREATE, KEEP, REMOVE, REWRITE

| Status | File | Notes |
|---|---|---|
| KEEP | `config/auth.ts` | BetterAuth config unchanged |
| KEEP | `config/auth-client.ts` | Auth client unchanged |
| KEEP | `config/prisma.ts` | Prisma client unchanged |
| KEEP | `infrastructure/ai/index.ts` | IAIService implementation unchanged |
| KEEP | `infrastructure/logger.ts` | Pino logger unchanged |
| KEEP | `infrastructure/rate-limiter.ts` | Rate limiter unchanged |
| KEEP | `infrastructure/queue/redis.ts` | Redis connection unchanged |
| KEEP | `infrastructure/latex/latex-compiler.ts` | pdflatex execution unchanged |
| KEEP | `infrastructure/latex/templates/` | Template files unchanged |
| KEEP | `infrastructure/pdf/index.ts` | PDF parser unchanged |
| KEEP | `interface/types.ts` | Hono Variables type unchanged |
| EVOLVE | `shared/index.ts` | Add new types, keep VaultBullet, remove Profile |
| EVOLVE | `core/domain/entities.ts` | Re-export from shared + add domain interfaces |
| EVOLVE | `core/domain/repositories.ts` | Add new repository interfaces, keep chat repo |
| EVOLVE | `infrastructure/chat-repository.ts` | Remove mode column dependency |
| EVOLVE | `infrastructure/latex/latex-template.ts` | Accept ResumeDraft input instead of Profile |
| EVOLVE | `infrastructure/queue/pdf-queue.ts` | Accept CompileJob type |
| EVOLVE | `infrastructure/queue/pdf-worker.ts` | Read from ResumeDraft instead of Profile |
| REWRITE | `index.ts` | New routes (memory, drafts, compile, github, parse, kb) |
| REWRITE | `di/container.ts` | Register all new services |
| REWRITE | `core/use-cases/chat-use-cases.ts` | Global chat, intent pipeline, MemoryAction flow |
| REWRITE | `core/use-cases/github-use-cases.ts` | Deterministic extraction pipeline |
| REWRITE | `core/use-cases/history-use-cases.ts` | Operate on ResumeDraft table |
| REWRITE | `interface/routes/chat.ts` | Single /interact endpoint |
| REWRITE | `interface/routes/resume.ts` | → split into drafts.ts + compile.ts + parse.ts |
| ADD | `core/ports/knowledge-base.ts` | IKnowledgeBaseService |
| ADD | `core/ports/retriever.ts` | IRetrieverService |
| ADD | `core/ports/resume-engine.ts` | IResumeEngine |
| ADD | `core/ports/resume-spec.ts` | IResumeSpecEngine |
| ADD | `core/ports/system-confidence.ts` | IConfidenceService |
| ADD | `core/ports/compiler.ts` | ICompilerService |
| ADD | `core/ports/github-analyzer.ts` | IGitHubAnalyzer |
| ADD | `core/ports/resume-fit.ts` | IResumeFitService |
| ADD | `core/services/retriever.ts` | Keyword matching, scoring, merge detection |
| ADD | `core/services/resume-spec.ts` | Rule application, truncation, reordering |
| ADD | `core/services/system-confidence.ts` | Provenance confidence computation |
| ADD | `core/services/resume-fit.ts` | JD-skill matching |
| ADD | `core/use-cases/memory-use-cases.ts` | Career Memory CRUD |
| ADD | `core/use-cases/draft-use-cases.ts` | Resume Draft CRUD + compile orchestration |
| ADD | `core/use-cases/resume-engine.ts` | JD→retrieve→select→spec pipeline |
| ADD | `core/use-cases/parse-use-cases.ts` | PDF upload → MemoryAction[] |
| ADD | `core/use-cases/kb-use-cases.ts` | Knowledge Base version info |
| ADD | `infrastructure/knowledge-base/loader.ts` | File system loading |
| ADD | `infrastructure/knowledge-base/bundle.ts` | Bundle generation |
| ADD | `infrastructure/persistence/experience-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/persistence/project-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/persistence/education-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/persistence/skill-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/persistence/certificate-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/persistence/achievement-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/persistence/raw-memory-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/persistence/draft-repository.ts` | Prisma CRUD |
| ADD | `infrastructure/github/analyzer.ts` | GitHub API + deterministic extraction |
| ADD | `interface/routes/memory.ts` | Career Memory routes |
| ADD | `interface/routes/drafts.ts` | Resume Draft routes |
| ADD | `interface/routes/compile.ts` | Compile status/result routes |
| ADD | `interface/routes/github.ts` | GitHub analyze/import routes |
| ADD | `interface/routes/parse.ts` | PDF parse route |
| ADD | `interface/routes/kb.ts` | KB version route |
| REMOVE | `core/use-cases/profile-use-cases.ts` | Replaced by memory-use-cases |
| REMOVE | `core/use-cases/ai-use-cases.ts` | Replaced by single-responsibility prompts |
| REMOVE | `core/use-cases/resume-use-cases.ts` | Replaced by resume-engine + draft-use-cases |
| REMOVE | `infrastructure/persistence/profile-repository.ts` | Profile table deprecated |
| REMOVE | `infrastructure/persistence/tailored-resume-repository.ts` | Replaced by draft-repository |
| REMOVE | `infrastructure/persistence/github-repo-repository.ts` | Replaced by raw-memory + project |
| REMOVE | `infrastructure/prompts/index.ts` | Prompts moved to knowledge/ KB files |
| REMOVE | `infrastructure/profile-utils.ts` | Profile migration utility |
| REMOVE | `interface/routes/profile.ts` | Profile routes deprecated |
| REMOVE | `interface/routes/ai.ts` | AI endpoints deprecated |
| REMOVE | `interface/schemas/compile-live.ts` | Replaced by draft-based compile |

---

## Mounting Routes (new `index.ts`)

```typescript
import { Hono } from "hono"
import { chatRouter } from "./interface/routes/chat"
import { memoryRouter } from "./interface/routes/memory"
import { draftRouter } from "./interface/routes/drafts"
import { compileRouter } from "./interface/routes/compile"
import { githubRouter } from "./interface/routes/github"
import { parseRouter } from "./interface/routes/parse"
import { kbRouter } from "./interface/routes/kb"
import { historyRouter } from "./interface/routes/history"

const app = new Hono()

// Auth middleware + rate limiters (same as current)
// ...

// Mount routes
const routes = app
  .route("/api/protected/chat", chatRouter)
  .route("/api/protected/memory", memoryRouter)
  .route("/api/protected/compile", compileRouter)      // compile-live, status, result
  .route("/api/protected/github", githubRouter)         // analyze, import
  .route("/api/protected/parse", parseRouter)           // pdf upload → parse
  .route("/api/protected/kb", kbRouter)                 // version info
  .route("/api/protected/history", historyRouter)       // list drafts (renamed from old history)

// Resume drafts are mounted separately for cleaner URL structure:
// /api/protected/resume-drafts/:id
```

---

*End of Backend Structure Document — Use this as the file-by-file implementation guide.*
