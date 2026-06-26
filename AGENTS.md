<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Session Log — All Phases Complete (2026-06-24)

### Phase 1-4: MVP Core (2026-06-13 → 2026-06-14)
- **Step 1**: Auth (Google OAuth, `@nsut.ac.in` domain restriction), landing page, PDF upload & AI parsing, profile save
- **Step 2**: Dashboard layout, profile editor (all sections), GitHub integration (repo fetch, import, AI README summarization)
- **Step 3**: Resume tailoring input, AI tailoring engine, side-by-side diff preview, PDF export via LaTeX
- **Step 4**: History dashboard (cards/modal/clone/edit/delete/search), template styling (3 templates, color/font/spacing), dark mode, glassmorphism, animations

### Phase 5: Design System & AI-Assisted Content (2026-06-17)
- **Step 5.1** — Design system: Tailwind v4 tokens, Satoshi/Inter/JetBrains Mono fonts, base components (Button, Input/Textarea, Badge, Card), `docs/ui_design.md`, `docs/data_saving_planning.md`
- **Step 5.2** — Universal AI component: `POST /api/ai/generate-bullets` endpoint, `AIAssistedContent` component (3 modes: AI generation, manual, hybrid), works for experience/projects/skills/summary
- **Step 5.3** — Onboarding multi-step wizard: 5 steps (PDF upload, experience, projects, skills, review) with back/next/skip
- **Step 5.4** — Profile dashboard AI integration: sparkle toggles per experience/project entry, AI skills categorization
- Pruned unused packages (`ai`, `@ai-sdk/openai`, `@google/generative-ai`)

### Frontend Refactor Merged (2026-06-24) — Pulled from DushyantBhardwaj2/resumeDatabase
- **New layout architecture**: `AppLayout` (sidebar + mobile nav + main), `Sidebar` (desktop, 228px, WORKSPACE + COMING SOON sections), `MobileNav` (mobile header + slide-in drawer), `AuthLayout` (two-column split for auth pages)
- **New UI components**: `Avatar`, `Dialog`, `Progress`, `Separator`, `Skeleton`, `Textarea`, `Tooltip`
- **New dashboard pages** (gated as "coming soon"): Resumes, Roles, Templates, ATS Score, Analytics, Settings
- **Icons**: Replaced lucide with `@phosphor-icons/react`
- **Tests**: Vitest 4 + jsdom + React Testing Library setup with 3 test files (sign-in button, auth redirect, auth flow)
- **New lib files**: `src/lib/auth.ts` (server-side session fetch), `src/lib/fetch.ts` (cookie-forwarding fetch), `src/lib/utils.ts` (cn, formatDate, getInitials, clamp, truncate)
- **Sign-in**: Extracted to reusable `SignInButton` component (default + minimal variants)
- **CI**: Cleaned up CI workflow (removed npx prisma generate from build)

### Phase 6: Career Vault Chat Interface (2026-06-24)
- **Phase 6.1** — Vault entity types: `VaultBullet`/`Certificate` types, `vaultBullets` replaces `bullets: string[]` on Experience/Project, backward-compat migration in profile repository
- **Phase 6.2** — AI infrastructure: `ChatUseCases` with `parseIntent()`/`expandVault()`/`selectBullets()`, Zod-validated AI responses, 3 new backend routes
- **Phase 6.3** — Zustand stores: `useBuilderStore` (split-screen state, toggleBullet, triggerCompile), `useChatStore` (messages, onboarding phases, sendMessage)
- **Phase 6.4** — Chat component library: `ChatContainer`, `MessageBubble`, `ChatInput` (localStorage drafts), `ResumeUploadWidget`, `TailoringChecklistWidget`
- **Phase 6.5** — Onboarding lockdown: new chat-driven onboarding page, middleware redirect via `onboarding_complete` cookie
- **Phase 6.6** — Split-screen builder: 35/65 layout, `LivePdfRenderer` (800ms debounced compile), `POST /api/protected/resume/compile-live` endpoint with pdflatex

### Routing Convention — ALL authenticated backend routes use `/api/protected/*`

The Vercel frontend proxies all `/api/*` requests to the Render backend. **Every route that requires authentication** must be under the `/api/protected/*` namespace — the Hono middleware in `backend/src/index.ts` automatically checks the session for all matching paths.

| Old (deprecated) | Correct replacement |
|---|---|
| `POST /api/resume/parse` | `POST /api/protected/resume/parse` |
| `POST /api/profile/save` | `POST /api/protected/profile` |
| `POST /api/resume/tailor` | `POST /api/protected/resume/tailor` |
| `POST /api/resume/compile` | `POST /api/protected/resume/compile` |

Routes that do NOT require auth (e.g., `GET /api/health`) stay outside `/api/protected/*`.

### New Chat Routes (Phase 6)
| Route | Purpose |
|---|---|
| `POST /api/protected/chat/interact` | Chat intent parsing & reply generation |
| `POST /api/protected/ai/expand-vault` | 12-bullet vault expansion |
| `POST /api/protected/ai/select-bullets` | JD-to-bullet matching |
| `POST /api/protected/resume/compile-live` | Debounced live PDF compilation |

### New Frontend Routes (Phase 6)
| Route | Purpose |
|---|---|
| `/onboarding` | Chat-driven profile creation (replaces old wizard) |
| `/tailor/builder` | Split-screen chat + live PDF preview |

### Status
- **Phase 1**: 22/22
- **Phase 2**: 21/21
- **Phase 3**: 18/18
- **Phase 4**: 23/23
- **Phase 5**: 38/38
- **Phase 6**: 20/20
- **Total**: **142/142 — MVP + Chat Interface Complete**
