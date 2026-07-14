# Resumint — UI/UX Architecture Document

> Generated from codebase analysis. No features or intentions are invented. All statements derive directly from source code and configuration files.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Page Inventory](#2-page-inventory)
3. [User Flows](#3-user-flows)
4. [Component Inventory](#4-component-inventory)
5. [Design System](#5-design-system)
6. [Chat UX](#6-chat-ux)
7. [Vault / Profile UX](#7-vault--profile-ux)
8. [Navigation](#8-navigation)
9. [Information Architecture](#9-information-architecture)
10. [State Management](#10-state-management)
11. [UX Observations](#11-ux-observations)
12. [Screenshots](#12-screenshots)
13. [Executive Summary](#13-executive-summary)

---

## 1. Project Overview

### What the Application Appears To Be

Resumint (branded as "ResumeMint" in the UI) is an AI-powered resume tailoring web application. It is positioned specifically for NSUT (Netaji Subhas University of Technology) students, per the page metadata. The application allows users to:

- Build a "Career Vault" — a structured profile of their education, experience, projects, and skills
- Upload an existing PDF resume to auto-populate their profile
- Tailor their resume to specific job descriptions using AI bullet-point selection
- Preview and compile LaTeX-based PDF resumes
- Track tailoring history

### Primary Purpose

To help job seekers (specifically students) create role-specific, ATS-optimized resumes by leveraging AI to select and organize the most relevant experience bullets for each job application.

### Major User Types

1. **Job-seeking students** — Primary users who onboard, build their Career Vault, and tailor resumes
2. **Authenticated return users** — Users who have completed onboarding and access the dashboard, profile, and tailor features

No admin or multi-tenant roles are detectable from the codebase.

### Overall Architecture

**Monorepo** with npm workspaces:

```
resumemint/
├── frontend/          # Next.js 16 application (Vercel-deployed)
├── backend/           # Hono Node.js server (Render-deployed)
├── packages/          # Shared packages (@resumint/shared lives inside backend/src/shared)
├── scripts/           # Build and CI scripts
```

**Deployment topology:**

- **Frontend:** Vercel (Next.js 16 with Turbopack, server-rendered React 19)
- **Backend:** Render (Docker container running Hono on Node.js)
- **Database:** PostgreSQL (via Supabase/Neon, accessed through Prisma ORM)
- **Redis:** Render-managed Redis instance (for BullMQ PDF compilation queue)
- **AI:** OpenAI-compatible API (via OpenCode Zen or OpenAI)

The frontend proxies `/api/*` requests to the backend via Next.js rewrites (dev mode) or Vercel's experimental services configuration (production).

### Frontend Framework

**Next.js 16.2.9** with:
- React 19.2.4 (Server Components + Client Components)
- Turbopack for development bundling
- App Router (file-based routing)
- Server-side rendering for authenticated layouts

### Backend Framework

**Hono 4.12.27** served via `@hono/node-server`:
- CORS middleware
- Zod validation (`@hono/zod-validator`)
- Rate limiting (Redis-backed, configurable)
- BetterAuth integration for session management
- BullMQ for async PDF compilation jobs

### State Management

Three **Zustand 5** stores:

| Store | Purpose |
|---|---|
| `useChatStore` | Chat messages, onboarding phase, chat mode, extracted data, typing state |
| `useBuilderStore` | Resume tailoring state: profile, selections, template, compile status, PDF URL |
| `useProfileStore` | Career Vault profile CRUD with auto-save debounce, localStorage draft persistence |

### Routing Structure

**Frontend (Next.js App Router):**

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/onboarding` | Chat-driven onboarding flow |
| `/dashboard` | Main dashboard (requires auth + profile) |
| `/dashboard/roles` | Saved roles (coming soon) |
| `/dashboard/templates` | Resume templates (coming soon) |
| `/dashboard/settings` | Account settings (coming soon) |
| `/dashboard/ats-score` | ATS scoring (coming soon) |
| `/dashboard/analytics` | Analytics (coming soon) |
| `/dashboard/resumes` | Saved resumes (coming soon) |
| `/dashboard/profile` | Redirects to `/profile` |
| `/profile` | Career Vault profile editor |
| `/tailor` | Resume tailoring flow |
| `/tailor/builder` | Redirected to `/tailor` |
| `/history` | Tailoring history |
| `/tips` | Tips page |
| `/access-denied` | Access denied page |
| `/auth/redirect` | OAuth callback handler |

**Backend (Hono routes):**

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/health` | No | Health check |
| `POST/GET /api/auth/**` | No | BetterAuth handlers |
| `GET /api/protected/profile` | Yes | Get user profile |
| `POST /api/protected/profile` | Yes | Save onboarding profile |
| `PATCH /api/protected/profile` | Yes | Update profile |
| `POST /api/protected/resume/parse` | Yes | Parse uploaded PDF resume |
| `POST /api/protected/resume/tailor` | Yes | AI tailor resume to JD |
| `POST /api/protected/resume/compile-live` | Yes | Queue PDF compilation |
| `GET /api/protected/resume/compile-status/:jobId` | Yes | Poll compilation status |
| `GET /api/protected/resume/compile-result/:jobId` | Yes | Fetch compiled PDF |
| `POST /api/protected/ai/generate-bullets` | Yes | Generate bullets from raw text |
| `POST /api/protected/ai/expand-vault` | Yes | Expand brief desc into 12 bullets |
| `POST /api/protected/ai/select-bullets` | Yes | Select best bullets for JD |
| `POST /api/protected/chat/interact` | Yes | Parse chat intent (AI routing) |
| `POST /api/protected/chat/save` | Yes | Save chat message |
| `GET /api/protected/chat/history` | Yes | Get chat history |
| `DELETE /api/protected/chat/clear` | Yes | Clear chat history |
| `GET /api/protected/history` | Yes | List tailored resumes |
| `GET /api/protected/history/:id` | Yes | Get specific tailored resume |
| `DELETE /api/protected/history/:id` | Yes | Delete tailored resume |
| `PATCH /api/protected/history/:id` | Yes | Update tailored resume |
| `PUT /api/protected/history/:id/styling` | Yes | Update resume styling |

### Styling System

**Tailwind CSS v4** with:
- Custom `@theme inline` tokens mapped to CSS custom properties
- Dark mode only (no light mode implementation detected — the design tokens in `:root` define dark colors and no light palette exists)
- "next-themes" is installed and `ThemeToggle` component exists, but only dark theme tokens are defined
- Custom `.glass` utility class for glassmorphism effects
- GSAP (GreenSock) for advanced animations (`ChromaGrid` component)
- `motion` library (Framer Motion v12 successor) for React animations (`AnimatedList`)
- Custom `@keyframes` for fade-up, float, pulse-glow, shimmer animations

### Component Library

Custom-built UI component library in `frontend/src/components/ui/` — **no external component library** (no shadcn/ui, MUI, etc.).

Components: `Button`, `Input`, `Textarea`, `Card` (+ sub-components), `Badge`, `Dialog`, `Progress`, `Skeleton`, `Separator`, `Tooltip`, `Avatar`, `Field`, `Splitter`, `BulletList`, `BorderGlow`, `ChromaGrid`, `AnimatedList`, `OverleafButton`, `SectionCard`.

### Authentication System

**BetterAuth** (v1.6.20) with:
- Google OAuth social sign-in (only provider detected)
- Session-based auth with cookies
- Server-side session verification via `getServerSession()`
- Frontend auth client with `signIn`, `signOut`, `useSession` hooks
- Backend middleware checks session for all `/api/protected/*` routes
- Rate limiting on auth routes (20 req/min per IP)

### API Communication

**Hono RPC client** (`hc` from `hono/client`):
- Type-safe API client generated from backend route types (`AppType`)
- Automatic cookie forwarding (`credentials: 'include'`)
- FormData detection for file uploads
- Server-side API client (`api-client-server.ts`) for server component usage

### Database Interaction

**Prisma ORM** with PostgreSQL:
- `User`, `Session`, `Account`, `Verification` models (BetterAuth managed)
- `Profile` model — JSON columns for flexible schemaless storage of resume sections
- `ChatMessage` model — persistent chat history per user per mode
- `TailoredResume` model — stored tailored resume output with JSON data
- `GitHubRepo` model — imported GitHub repos with generated bullets

---

## 2. Page Inventory

### Landing Page (`/`)

| Property | Value |
|---|---|
| **Route** | `/` |
| **Purpose** | Marketing landing page with sign-in CTA |
| **Entry points** | Direct URL, root domain |
| **Components rendered** | `SignInButton`, Link cards for Dashboard, Career Vault, Tailor |
| **Primary user goal** | Sign in or learn about the app |
| **Possible actions** | Click "Sign in with Google", navigate to Dashboard/Career Vault/Tailor cards |
| **Navigation options** | Three navigation cards, sign-in button |
| **API calls** | None (static, server-rendered) |
| **Data displayed** | App name, tagline, feature bullets (Live ATS scoring, Per-job tailoring, Smart version tracking) |
| **Loading states** | None (static page) |
| **Empty states** | N/A |
| **Error states** | N/A |
| **Permissions required** | None |
| **Responsive behavior** | Cards grid goes from 3 columns to 1 column on small screens |
| **Dependencies** | `@/components/sign-in-button` |
| **Files involved** | `frontend/src/app/page.tsx` |

### Auth Redirect (`/auth/redirect`)

| Property | Value |
|---|---|
| **Route** | `/auth/redirect` |
| **Purpose** | OAuth callback handler — checks session, redirects to dashboard or onboarding |
| **Entry points** | After Google OAuth sign-in |
| **Primary user goal** | Complete authentication flow |
| **Possible actions** | Automatic redirect only |
| **API calls** | `GET /api/protected/profile` (server-side) |
| **Permissions required** | Valid session after OAuth |
| **Dependencies** | `getServerSession`, `serverApi` |
| **Files involved** | `frontend/src/app/auth/redirect/page.tsx`, `error.tsx` |

### Onboarding (`/onboarding`)

| Property | Value |
|---|---|
| **Route** | `/onboarding` |
| **Purpose** | Chat-driven profile creation — upload resume or describe experience |
| **Entry points** | Auth redirect when no profile exists |
| **Layout** | Full viewport, two-panel: 40% chat / 60% live profile preview |
| **Components rendered** | `ChatContainer`, `ChatInput`, `OnboardingPreviewPanel`, `ResumeUploadWidget` (inside chat) |
| **Primary user goal** | Build Career Vault profile via AI chat |
| **Possible actions** | Upload PDF resume, type messages, confirm data, edit preview |
| **Navigation options** | None: redirects to `/dashboard` on completion |
| **API calls** | `POST /api/protected/resume/parse`, `POST /api/protected/chat/interact`, `POST /api/protected/chat/save`, `GET /api/protected/chat/history`, `POST /api/protected/profile` |
| **Data displayed** | Chat messages, live profile preview panel |
| **Loading states** | Typing indicator, parsing spinner in upload widget |
| **Empty states** | Greeting message with upload dropzone |
| **Error states** | Error boundary fallback, toast on save failure |
| **Permissions required** | Authenticated (proxy middleware checks cookies) |
| **Responsive behavior** | Two-panel on desktop (lg:flex-row), stacks on mobile |
| **Dependencies** | `useChatStore`, `ChatContainer`, `ChatInput`, `OnboardingPreviewPanel` |
| **Files involved** | `onboarding/page.tsx`, `onboarding/error.tsx`, `proxy.ts` |

### Dashboard (`/dashboard`)

| Property | Value |
|---|---|
| **Route** | `/dashboard` |
| **Purpose** | Main workspace showing vault stats, completeness, ATS score, quick actions |
| **Entry points** | After onboarding completion, from sidebar nav |
| **Layout** | Sidebar layout via `AppLayout` |
| **Components rendered** | `DashboardWelcomeWidget`, `DashboardStatsWidget`, `DashboardCompletenessWidget`, `DashboardQuickActionsWidget`, AtsWidget (inline) |
| **Primary user goal** | View profile overview and navigate to actions |
| **Possible actions** | Navigate to Tailor, Profile, History via sidebar |
| **Navigation options** | Sidebar: Home, Career Vault, Tailor, History; bottom: Sign Out |
| **API calls** | `GET /api/protected/profile` (server-side) |
| **Data displayed** | User greeting, counts (education, experience, projects, skills), completeness %, ATS score (hardcoded 82%), quick action cards |
| **Loading states** | Server-side rendered; widgets fade-up animate |
| **Empty states** | If profile fetch fails, defaults to 0 counts |
| **Error states** | Error boundary |
| **Permissions required** | Authenticated, has profile (redirects to `/onboarding` if missing) |
| **Responsive behavior** | 3-column stats grid goes to 1 column on mobile |
| **Dependencies** | `AppLayout`, `Dashboard*Widget` components, `getServerSession`, `hasProfile` |
| **Files involved** | `dashboard/layout.tsx`, `dashboard/page.tsx`, `dashboard/nav.tsx`, `dashboard/dashboard-chat-client.tsx` |

### Profile Vault (`/profile`)

| Property | Value |
|---|---|
| **Route** | `/profile` |
| **Purpose** | Full Career Vault profile editor |
| **Entry points** | Sidebar "Career Vault" link |
| **Layout** | Sidebar layout via `AppLayout` |
| **User goal** | View and edit all sections of the Career Vault |
| **API calls** | `PATCH /api/protected/profile` (auto-save) |
| **Permissions required** | Authenticated, has profile |

### Tailor (`/tailor`)

| Property | Value |
|---|---|
| **Route** | `/tailor` |
| **Purpose** | Core resume tailoring flow — enter job description, select matching experience bullets, preview compiled PDF |
| **Entry points** | Sidebar "Tailor" link |
| **Layout** | Sidebar layout via `AppLayout` |
| **Components rendered** | Multiple chat widgets (TailorInputWidget, SelectionWidgets, LivePdfRenderer), ChatContainer |
| **User goal** | Tailor resume to a specific job description |
| **API calls** | `POST /api/protected/resume/tailor`, `POST /api/protected/resume/compile-live`, polling status, `GET /api/protected/profile` |
| **Permissions required** | Authenticated, has profile |

### History (`/history`)

| Property | Value |
|---|---|
| **Route** | `/history` |
| **Purpose** | Browse previously tailored resumes |
| **Entry points** | Sidebar "History" link |
| **Layout** | Sidebar layout via `AppLayout` |
| **API calls** | `GET /api/protected/history`, `DELETE /api/protected/history/:id` |
| **Permissions required** | Authenticated, has profile |

### Tips (`/tips`)

| Property | Value |
|---|---|
| **Route** | `/tips` |
| **Purpose** | Tips page (content not analyzed) |
| **Permissions required** | Authenticated, has profile |

### Dashboard Sub-pages (all "Coming Soon")

| Route | Purpose |
|---|---|
| `/dashboard/roles` | Saved job roles (coming soon) |
| `/dashboard/templates` | Resume template gallery (coming soon) |
| `/dashboard/settings` | Account settings (coming soon) |
| `/dashboard/ats-score` | ATS score details (coming soon) |
| `/dashboard/analytics` | Application analytics (coming soon) |
| `/dashboard/resumes` | Saved resume versions (coming soon) |

All share the same pattern: icon header, "Coming soon" badge, description, "Back to dashboard" link.

### Access Denied (`/access-denied`)

| Property | Value |
|---|---|
| **Route** | `/access-denied` |
| **Purpose** | Shown when user lacks permissions |
| **Content** | Not analyzed in detail; exists as a route |

---

## 3. User Flows

### Flow 1: Sign In / Auth

```
Landing Page (/)
  ↓
Click "Sign in with Google"
  ↓
Google OAuth flow
  ↓
Redirect to /auth/redirect
  ↓
Backend checks session → fetches profile
  ↓
[Has profile] → /dashboard
[No profile] → /onboarding
```

- **Trigger:** User clicks sign-in button on landing page
- **Components involved:** `SignInButton` → BetterAuth handler → `AuthRedirectPage`
- **API endpoints:** BetterAuth OAuth, `GET /api/protected/profile`
- **State updates:** Session cookie set by BetterAuth
- **Success path:** Redirect to `/dashboard` (existing user) or `/onboarding` (new user)
- **Failure path:** Redirect to `/?error=` with error message

### Flow 2: Onboarding (Create Career Vault)

```
/onboarding
  ↓
Chat greeting with UPLOAD_DROPZONE widget
  ↓
User uploads PDF resume
  ↓
POST /api/protected/resume/parse → returns structured profile
  ↓
extractedData set in Zustand store
Assistant message: "Reply 'looks good' to continue"
  ↓
User types "looks good"
  ↓
POST /api/protected/chat/interact
  ↓
AI returns { intent: "NAVIGATE", targetWidget: "REVIEW" }
  ↓
currentPhase → COMPLETE (via mapWidgetToPhase)
  ↓
useEffect fires → POST /api/protected/profile
  ↓
[Success] → toast "Profile created!" → redirect /dashboard
[Failure] → toast "Failed to save profile"
```

- **Trigger:** No existing profile found after auth
- **Components involved:** `ChatContainer`, `ChatInput`, `ResumeUploadWidget`, `OnboardingPreviewPanel`, `useChatStore`, `OnboardingPage`
- **API endpoints:** `GET /api/protected/profile`, `POST /api/protected/resume/parse`, `POST /api/protected/chat/interact`, `POST /api/protected/profile`, `POST /api/protected/chat/save`
- **State updates:** `extractedData` set from parse, `currentPhase` transitions GREETING → COMPLETE, `isTyping` toggles
- **Success path:** Profile created, redirect to dashboard
- **Failure path:** Toast error, stays on onboarding

### Flow 3: Dashboard Landing

```
/dashboard
  ↓
Server checks session + profile existence
  ↓
DashboardPage fetches profile server-side
  ↓
DashboardChatClient adds widgets for welcome, stats, completeness, actions
  ↓
User sees overview with counts, completeness bar, ATS score
  ↓
User can navigate via sidebar
```

- **Trigger:** After onboarding or direct navigation
- **Components involved:** `DashboardLayout`, `AppLayout`, `Sidebar`, `Dashboard*Widgets`, `DashboardChatClient`
- **API endpoints:** `GET /api/protected/profile`
- **State updates:** `useChatStore` mode set to 'DASHBOARD', welcome messages added

### Flow 4: Tailor Resume

```
/tailor
  ↓
Job description entry form (chat widget)
  ↓
User enters JD + clicks "Tailor Resume"
  ↓
POST /api/protected/resume/tailor
  ↓
Backend: AI selects matching bullets from vault
Backend: AI generates summary
Backend: Builds tailored output + LaTeX
Backend: Saves to TailoredResume table
  ↓
Response populates builder store: profile, selections
  ↓
User can:
  - Toggle individual bullets on/off
  - Toggle entire experiences/projects
  - Select/deselect education entries
  - Choose template (nsut-canonical, ats-clean, modern, compact)
  - Set contact info visibility
  ↓
triggerCompile() → POST /api/protected/resume/compile-live
  ↓
BullMQ enqueues PDF compilation job
  ↓
Poll compile-status/:jobId every 600ms
  ↓
[Complete] → fetch compiled-result/:jobId → create blob URL
  ↓
PDF preview updates in LivePdfRenderer
```

- **Trigger:** User navigates to /tailor and enters a job description
- **Components involved:** `ChatContainer`, `TailorInputWidget`, bullet selection widgets, `LivePdfRenderer`, `Splitter`, `useBuilderStore`
- **API endpoints:** `GET /api/protected/profile`, `POST /api/protected/resume/tailor`, `POST /api/protected/resume/compile-live`, polling status/result
- **State updates:** `useBuilderStore` fully managed: profile, selections, compile status, PDF URL, zoom level
- **Success path:** PDF preview shows tailored resume
- **Failure path:** Toast error, status set to 'error'

### Flow 5: Edit Career Vault

```
/profile
  ↓
useProfileStore.loadProfile() → GET /api/protected/profile
  ↓
Profile loaded into store with original snapshot
  ↓
User edits any section (contact, experience, projects, education, skills, certificates)
  ↓
Each edit → updateProfile() → set state
  ↓
500ms debounce → saveProfile() → PATCH /api/protected/profile
  ↓
Draft saved to localStorage on every edit
  ↓
[Success] → save state: 'saved' (shows for 2s), then returns to 'idle'
[Failure] → toast "Failed to save profile", state: 'error'
```

- **Trigger:** User visits /profile
- **State updates:** `useProfileStore` manages profile CRUD with dirty-checking, auto-save, localStorage draft
- **API endpoints:** `GET /api/protected/profile`, `PATCH /api/protected/profile`

### Flow 6: View History

```
/history
  ↓
Load list of tailored resumes from GET /api/protected/history
  ↓
Display in table/list
  ↓
[Click item] → View details (GET /api/protected/history/:id)
[Delete] → DELETE /api/protected/history/:id
```

---

## 4. Component Inventory

### 4.1 UI Primitives (`frontend/src/components/ui/`)

#### Button
- **Props:** `variant` (primary|secondary|ghost|outline|destructive), `size` (sm|md|lg|icon), `loading`, `icon`, `iconRight`, `fullWidth`
- **States:** Default, hover, active (`scale-[0.98]`), disabled, loading (spinning ArrowClockwise icon)
- **Variants:** Primary (green bg), Secondary (card bg), Ghost (transparent), Outline (bordered), Destructive (red)
- **Accessibility:** `focus-visible` ring, `disabled` attributes, `aria-hidden` on icons
- **Dependencies:** `@phosphor-icons/react` (ArrowClockwise)

#### Input
- **Props:** `label`, `helperText`, `error`, `icon`, standard input attrs
- **States:** Default, focus (brand border + ring), error (red border), disabled
- **Accessibility:** Label linked via `htmlFor`/`id`, `aria-describedby` for errors/helper, `aria-invalid`
- **Dependencies:** `React.useId()` for generated IDs

#### Textarea
- **Props:** `label`, `helperText`, `error`, `rows` (default 4)
- **States:** Same as Input
- **Accessibility:** Same pattern as Input

#### Card (composite)
- **Sub-components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Card props:** `variant` (default|ghost|bordered), `padding` (none|sm|md|lg)
- **Variants:** Default (bg-card + border + shadow), Ghost (transparent), Bordered (stronger border)
- **Used on:** Every authenticated page

#### Badge
- **Props:** `variant` (default|success|warning|error|outline), `size` (sm|md), `icon`
- **Visual variants:** Default (muted), Success (green), Warning (amber), Error (red), Outline (transparent)
- **Used on:** Dashboard widgets, template cards

#### Dialog (Modal)
- **Props:** `open`, `onClose`, `title`, `description`, `children`, `footer`, `size` (sm|md|lg)
- **States:** Open/closed
- **Features:** Escape key closes, click-outside-to-close, body scroll lock, portal to `document.body`, `aria-modal`, `aria-labelledby`, `aria-describedby`
- **Animations:** fade-up on content
- **Dependencies:** `@phosphor-icons/react` (XCircle), `createPortal`

#### Progress
- **Props:** `value` (0-100), `size` (sm|md|lg), `label`, `showValue`
- **Accessibility:** `role="progressbar"`, `aria-valuenow/min/max`
- **Used on:** Dashboard completeness widget

#### Skeleton
- **Sub-components:** `Skeleton`, `SkeletonText`, `SkeletonTitle`, `SkeletonCard`
- **Props:** `className`, `width`, `height`
- **States:** Shimmer animation via CSS class
- **Used on:** (Defined but usage not confirmed in pages)

#### Separator
- **Props:** `orientation` (horizontal|vertical)
- **Accessibility:** `role="separator"`, `aria-orientation`

#### Tooltip
- **Props:** `content`, `children`
- **Positioning:** Top by default, CSS-powered (bottom-full, left-1/2)
- **Interaction:** CSS `group-hover` for show/hide
- **Accessibility:** `role="tooltip"`

#### Avatar
- **Props:** `src`, `name`, `size` (sm|md|lg)
- **Behavior:** Shows image if src provided, else generates initials (max 2 chars) from name
- **Fallback:** Green brand-light background with brand text initials

#### Field
- **Props:** `label`, `value`, `onChange`, `layout` (vertical|horizontal), `labelWidth`, `placeholder`, `type`
- **Note:** This component uses older CSS variable names (border-border, bg-background, text-muted-foreground) inconsistent with the design system

#### Splitter
- **Props:** `onResize`, `value`, `min`, `max`
- **Behavior:** Draggable divider for resizable panels. Uses pointer events.
- **Accessibility:** `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow/min/max`, keyboard: ArrowLeft/Right/Home/End
- **Used on:** Builder split-screen

#### BulletList
- **Props:** `items`, `onChange`, `placeholder`
- **Behavior:** Editable list of bullet points with add/remove
- **Note:** Uses older CSS variable names (border-border, bg-background, text-muted-foreground)

#### BorderGlow
- **Props:** `children`, `animated`, `glowColor`, `className`
- **Behavior:** Animated conic gradient border when `animated=true`
- **CSS:** Custom pseudo-element with `mask-composite: exclude`, rotation animation

#### ChromaGrid
- **Props:** `items`, `renderItem`, `columns` (2|3|4)
- **Behavior:** Animated grid with GSAP mouse-tracking spotlight effect
- **Dependencies:** `gsap`
- **Used on:** Templates page

#### AnimatedList
- **Props:** `items`, `renderItem`, `className`, `delay`
- **Behavior:** Staggered fade-up animation on scroll into view
- **Dependencies:** `motion/react` (motion.div + variants)

#### OverleafButton
- **Props:** `latexCode`
- **Behavior:** Form POST to Overleaf for LaTeX editing
- **Dependencies:** `Button`

#### SectionCard
- **Props:** `title`, `spacing` (sm|md), `children`
- **Behavior:** Simple titled card wrapper

### 4.2 Layout Components (`frontend/src/components/layout/`)

#### AppLayout
- **Props:** `user`, `children`
- **Structure:** Sidebar (desktop) + main content area
- **Children:** Rendered with sidebar on the left
- **Behavior:** Responsive — sidebar collapses on mobile

#### Sidebar
- **Props:** `user`, `collapsed`, `onToggleCollapse`
- **Navigation items:** Home (`/dashboard`), Career Vault (`/profile`), Tailor (`/tailor`), History (`/history`)
- **Features:** Active link highlighting (via `useIsActive` hook), recent tailor history list, theme toggle, sign-out
- **Bottom section:** Theme toggle, settings, sign out
- **Animation:** Width transition 300ms between collapsed (72px) and expanded (240px)
- **Dependencies:** `@phosphor-icons/react`, `useIsActive`, `ThemeToggle`, `Avatar`

### 4.3 Auth Components

#### SignInButton
- **Props:** `variant` (default|minimal)
- **Behavior:** Triggers Google OAuth sign-in via BetterAuth
- **Callback URL:** `/auth/redirect`

#### Auth Client (`auth-client.ts`)
- **Exports:** `signIn`, `signOut`, `useSession` from BetterAuth

### 4.4 Theme Components

#### ThemeToggle
- **Behavior:** Dark/light toggle using `next-themes`. Falls back to null until client-mounted (uses `useSyncExternalStore` for hydration safety).
- **Icons:** Sun (dark mode), Moon (light mode) — from `@phosphor-icons/react`
- **Note:** Only dark mode design tokens are defined in CSS; light mode behavior cannot be verified from code alone.

### 4.5 Chat Components (`frontend/src/components/chat/`)

#### ChatContainer
- **Props:** `mode` (ONBOARDING|BUILDER|DASHBOARD|TAILOR|PROFILE), `renderInput` (boolean)
- **Behavior:** Renders messages for the given mode from `useChatStore`, includes message bubble rendering
- **Sub-components:** `MessageBubble` — renders content + optional widgets based on `message.widget`

#### ChatInput
- **Props:** `onSend`, `disabled`, `placeholder`
- **Behavior:** Text input with send button, handles Enter key submission

#### MessageBubble
- **Behavior:** Renders chat messages with role-based styling (user vs assistant) and optional widget rendering

### 4.6 Chat Widgets (`frontend/src/components/chat/widgets/`)

Widgets are embedded inside chat messages via the `widget` property on `ChatMessage`. Each widget corresponds to a specific UI component.

| Widget Name | Component | Purpose |
|---|---|---|
| `UPLOAD_DROPZONE` | `ResumeUploadWidget` | Drag/drop PDF upload for onboarding |
| `DASHBOARD_WELCOME` | `DashboardWelcomeWidget` | Welcome greeting on dashboard |
| `DASHBOARD_STATS` | `DashboardStatsWidget` | Education/experience/projects/skills counts |
| `DASHBOARD_COMPLETENESS` | `DashboardCompletenessWidget` | Profile completeness percentage |
| `DASHBOARD_QUICK_ACTIONS` | `DashboardQuickActionsWidget` | Quick navigation cards |
| `TAILOR_INPUT` | `TailorInputWidget` | Job description entry form |
| `PROFILE_GENERATOR` | `ProfileGeneratorWidget` | AI-generated profile data editor |
| Various selection | Bullet selection checklists | Toggle bullets per experience/project |

### 4.7 Other Components

#### AIAssistedContent
- **Props:** `section`, `onAccept`, `existingItems`, `context`, `placeholder`, `label`
- **Behavior:** Three-mode component: input (raw text), review (AI-generated bullets with checkboxes), done (accepted state)
- **Sections:** experience, projects, skills, summary, project, experience_entry
- **API:** `POST /api/protected/ai/generate-bullets`

#### OnboardingPreviewPanel
- **Behavior:** Live preview of profile data as user builds it during onboarding
- **Rendered on:** `/onboarding` right panel

#### LivePdfRenderer
- **Behavior:** Renders compiled PDF preview in the builder, updates on selection changes with 800ms debounce
- **API:** `POST /api/protected/resume/compile-live`, polling

---

## 5. Design System

### Key Finding: Dark Mode Only

The CSS defines only one set of design tokens in `:root` — all dark mode colors. No light palette is defined. The `ThemeToggle` component and `next-themes` are installed, suggesting intent for theme switching, but light mode would render incorrectly (black text on dark surfaces) if activated. The `next-themes` `ThemeProvider` uses `defaultTheme="system"`.

### Typography

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `'Cabinet Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif` | Headings, brand name, large text |
| `--font-sans` | `'Satoshi', 'Inter', system-ui, sans-serif` | Body text |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` (via fontsource) | Code/monospace |
| `--font-mono-jetbrains` | Custom property from Next.js font loader | Monospace variable font |

Fonts loaded from Fontshare CDN in the root layout `<head>`.

### Colors

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| Background | `#09090b` | `--bg` | Page background |
| Surface | `#0c0c0e` | `--surface` | Sidebar, secondary surfaces |
| Card | `#141417` | `--card` | Card backgrounds |
| Muted | `#1a1a1e` | `--muted` | Muted backgrounds |
| Foreground | `#f2f2f4` | `--fg` | Primary text |
| Foreground-2 | `#e4e4e7` | `--fg-2` | Secondary text |
| Muted FG | `#a1a1aa` | `--muted-fg` | Muted text |
| Meta | `#71717a` | `--meta` | Subdued text |
| Border | `#27272b` | `--border` | Standard borders |
| Border Soft | `#1e1e22` | `--border-soft` | Subtle borders |
| Accent/Brand | `#16a34a` | `--accent` / `--brand` | Primary green accent |
| Accent Hover | `#15803d` | `--accent-hover` | Hover state |
| Brand Light | rgba(22,163,74,0.12) | `--accent-soft` | Subtle brand bg |
| Brand FG | `#FFFFFF` | `--brand-fg` | Text on brand bg |
| Success | `#22c55e` | `--success` | Success states |
| Warning | `#f59e0b` | `--warn` | Warning states |
| Danger | `#ef4444` | `--danger` | Error/danger states |

**Tailwind v4 semantic bindings** map these to `--color-*` tokens.

### Spacing

Uses Tailwind's default spacing scale. No custom spacing tokens detected.

### Border Radius

| Token | Value |
|---|---|
| `--radius-sm` | 6px |
| `--radius-md` | 10px |
| `--radius-lg` | 14px |
| `--radius-xl` | 20px |
| `--radius-2xl` | 28px |
| `--radius-pill` | 9999px |

### Glassmorphism

Two utility classes:

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

### Shadows

No custom shadow tokens defined. Inline box-shadows used in `.glass` and `.card-lift` utilities.

### Animations

| Name | Type | Purpose |
|---|---|---|
| `fade-up` | 0.5s ease-out-expo | Elements entering viewport |
| `float` | 8s ease-in-out infinite | Floating background orbs |
| `pulse-glow` | 4s ease-in-out infinite | Pulsing brand dot |
| `ats-grow` | 1s cubic-bezier | ATS progress bar fill |
| `bounce-dot` | 1.4s infinite | Typing indicator |
| `shimmer` | 1.5s linear infinite | Skeleton loading shimmer |

**Animation utility classes:**
- `.animate-fade-up` through `.animate-fade-up-d4` with staggered delays (0, 80ms, 160ms, 240ms, 320ms)
- `.delay-75` through `.delay-300` for custom delays

**Easing:** `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` used throughout.

### Icons

**`@phosphor-icons/react`** — the sole icon library. Every icon usage in the codebase imports from this library. Avoided: `lucide-react` per architecture rules. Some inline SVG is used for decorative elements.

### Responsive Breakpoints

Tailwind v4 default breakpoints are used. No custom breakpoints detected.

### Accessibility

- `prefers-reduced-motion` media query disables all animations
- `prefers-contrast: more` enhances glass borders
- Error boundaries catch and display errors with retry buttons
- `aria-*` attributes on interactive components (Dialog, Progress, Splitter, Tooltip, Button)
- Focus-visible outlines on interactive elements

### CSS Variable Inconsistencies

Some older components (`Field.tsx`, `BulletList.tsx`) use CSS variable names that don't match the current design tokens:
- `--border` (boarder) instead of `--edge` — likely a typo
- `--muted-foreground` instead of `--content-muted`
- `--border-border` instead of `--border`
- `--bg-background` instead of `--bg` or `--surface`

These components appear to be remnants from an earlier version or migration.

---

## 6. Chat UX

### Purpose

The chat interface serves as the **primary interaction paradigm** for the application. It is not a secondary feature — it is the main way users interact with the AI to build profiles, tailor resumes, and navigate the app.

### Conversation Flow Architecture

The chat operates in **four independent modes**, each with its own message history:

| Mode | Purpose |
|---|---|
| `ONBOARDING` | Guide new users through profile creation |
| `DASHBOARD` | Display dashboard widgets and overview |
| `TAILOR` | Facilitate resume tailoring flow |
| `BUILDER` | Split-screen resume builder |
| `PROFILE` | Profile-related interactions |

### Message Lifecycle

1. **User sends message** → `ChatInput.onSend` → `useChatStore.sendMessage()`
2. **User message added to store** → immediately visible in UI
3. **Loading state** → `isTyping: true`, spinner shown
4. **POST to `/api/protected/chat/interact`** → body includes full conversation history + current phase
5. **Backend AI processing** → `ChatUseCases.parseIntent()` builds system prompt + calls AI
6. **Response parsed** → Zod validates AI JSON output (intent, targetWidget, reply, extractedData)
7. **Response stored** → assistant message added to store, `isTyping: false`
8. **Phase update** → if intent is `NAVIGATE` with targetWidget, phase mapped via `mapWidgetToPhase()`
9. **State merge** → if AI returns `extractedData`, merged into store
10. **Background persistence** → both messages saved via `POST /api/protected/chat/save` (fire-and-forget)

### Message Rendering

Messages include a `widget` field that triggers specialized renderers:
- `UPLOAD_DROPZONE` → file upload component
- `DASHBOARD_*` → statistics widgets
- `TAILOR_INPUT` → job description form
- `PROFILE_GENERATOR` → AI-generated content editor
- Widget types linked to bullet selection checklists

### Streaming

**Not implemented.** The chat response is fully awaited before display. No streaming SSE or WebSocket detected.

### Attachments

File upload is limited to PDF files (max 5MB) via the `ResumeUploadWidget` during onboarding. Attachments are processed server-side (text extraction + AI parsing).

### URL Scraping

When a user message contains URLs, the backend fetches content via `https://r.jina.ai/{url}` (Jina AI reader), injects scraped content into the AI context, and processes it for project/experience extraction.

### Suggested Prompts

Not explicitly implemented. The onboarding greeting mentions options (upload resume, describe experience, type freely) but no clickable suggested prompts are detectable.

### Sidebar Behavior

No sidebar is present during chat. The chat interface is the primary focus. Sidebar appears only in the authenticated layout (dashboard, profile, tailor, history).

### History

Chat history persists per user per mode in the `ChatMessage` database table. Loaded on page init via `loadHistory()`. Cleared via `/clear` endpoint.

### Context Management

The full conversation history is sent to the AI on every interaction. The system prompt includes the user's current onboarding phase. No context window management or message truncation strategy is detectable.

### Input Actions

- Text input with Enter-to-send
- File upload (drag/drop or click-to-browse) in widget mode

### Keyboard Shortcuts

None detectable.

### Loading Behavior

Typing indicator (bouncing dots) shows while AI is processing. The spinner uses CSS `animate-bounce-dot` keyframes.

### Error Recovery

If the AI call fails (throws), the backend returns a fallback message: `"I didn't quite catch that. Can you rephrase?"` with `intent: "GENERAL_CHAT"` and `targetWidget: null`. The frontend catches network errors and shows a "Sorry, I couldn't process that" message.

---

## 7. Vault / Profile UX

### Purpose

The "Career Vault" (`/profile`) is a structured, editable repository of the user's professional profile — the source of truth for all resume tailoring. It stores contact, education, experience, projects, skills, certificates, extracurriculars, and GitHub repos.

### Data Model

The `Profile` Prisma model uses **JSON columns** for flexible schema storage:
- `contact` — `Contact` object (name, email, phone, linkedin, github, leetcode, portfolio + plural variants)
- `education` — Array of `Education` objects
- `experience` — Array of `Experience` objects (with `VaultBullet[]`)
- `projects` — Array of `Project` objects (with `VaultBullet[]`)
- `skills` — `Skills` object (languages, frameworks, tools)
- `certificates` — Array of `Certificate` objects
- `extracurriculars` — Array of `ExtracurricularItem` objects

### Creation Flow

Handled entirely through onboarding chat (see Flow 2). Two paths:
1. **PDF upload** → AI parses → user confirms → profile saved
2. **Manual text** → AI extracts structured data → user confirms → profile saved

### Editing Flow

On the `/profile` page (accessed via sidebar), users can edit all sections. The `useProfileStore` manages:
- **Auto-save** with 500ms debounce after any edit
- **Dirty checking** via `fast-deep-equal` between current and original snapshot
- **Draft persistence** to `localStorage` under key `profile-draft`
- **Save states:** `idle` → `saving` → `saved` (2s) → `idle`, or `error`

### Deletion

Individual items (experience, project, certificate) can be deleted via the profile store methods. No bulk operations detected.

### Relationships

- Profile belongs to one User (1:1 relation)
- TailoredResume references User (1:N) — captures each tailoring session
- GitHubRepo references User (1:N) — imported repos per user
- ChatMessage references User (1:N) — conversation history

### GitHub Integration

Via `GithubUseCases`:
- Import repos from GitHub
- Fetch README content via GitHub API
- AI generates bullet points from repo name + README
- Upserts into `GitHubRepo` table and merges into profile projects

---

## 8. Navigation

### Global Navigation

The authenticated layout (`AppLayout`) provides a **persistent sidebar** on all authenticated pages (dashboard, profile, tailor, history).

### Sidebar Structure

```
┌─────────────────────────────┐
│ [M] ResumeMint (brand logo) │
├─────────────────────────────┤
│ □ Home        → /dashboard  │
│ □ Career Vault → /profile   │
│ ✦ Tailor      → /tailor     │
│ 🕐 History     → /history   │
├─────────────────────────────┤
│ Recent Tailors (last 5)     │
│ - SWE at Google             │
│ - Intern at ...             │
├─────────────────────────────┤
│ ☀/☾ Theme toggle           │
│ ⚙ Settings                  │
│ ⇤ Sign Out                  │
└─────────────────────────────┘
```

### Local Navigation

- **Dashboard sub-pages**: Roles, Templates, Settings, ATS Score, Analytics, Resumes — all marked "Coming Soon" with back-to-dashboard links
- **Tailor**: Wizard-like linear flow (JD input → selection → preview)
- **Onboarding**: Linear chat flow, no navigation

### Breadcrumbs

None detected.

### Top Bar

- **Landing page**: No top bar
- **Onboarding**: Minimal header with brand name + "Onboarding" badge + "AI-Powered Career Vault" tagline + pulsing dot
- **Authenticated pages**: Sidebar only, no top bar

### Context Menus

None detected.

### Shortcuts

None detected.

### Deep Linking

- `/onboarding` checks for existing profile and redirects accordingly
- `/dashboard/profile` redirects to `/profile`

---

## 9. Information Architecture

```
Resumint Application
│
├── Unauthenticated
│   ├── Landing Page (/)
│   └── Auth (/auth/*)
│       └── OAuth Redirect (/auth/redirect)
│
├── Onboarding (/onboarding)
│   └── Chat-driven profile creation
│       ├── Resume Upload (PDF)
│       ├── Manual Description
│       └── Profile Confirmation
│
├── Authenticated (requires profile)
│   ├── Dashboard (/dashboard)
│   │   ├── Welcome + Stats
│   │   ├── Vault Overview
│   │   ├── Profile Completeness
│   │   ├── ATS Score (hardcoded)
│   │   └── Quick Actions
│   │   │
│   │   ├── Sub-pages (all "Coming Soon")
│   │   │   ├── Roles (/dashboard/roles)
│   │   │   ├── Templates (/dashboard/templates)
│   │   │   ├── Settings (/dashboard/settings)
│   │   │   ├── ATS Score (/dashboard/ats-score)
│   │   │   ├── Analytics (/dashboard/analytics)
│   │   │   └── Resumes (/dashboard/resumes)
│   │   │
│   │   └── Profile (redirect) (/dashboard/profile) → /profile
│   │
│   ├── Career Vault (/profile)
│   │   ├── Contact
│   │   ├── Education
│   │   ├── Experience (with Vault Bullets)
│   │   ├── Projects (with Vault Bullets)
│   │   ├── Skills (languages, frameworks, tools)
│   │   ├── Certificates
│   │   └── Extracurriculars
│   │
│   ├── Tailor (/tailor)
│   │   ├── JD Input
│   │   ├── Bullet Selection
│   │   ├── Template Selection
│   │   ├── Contact Selection
│   │   └── Live PDF Preview
│   │
│   ├── History (/history)
│   │   └── Tailored Resumes List
│   │
│   ├── Tips (/tips)
│   │
│   └── Access Denied (/access-denied)
│
├── API (separate service)
│   ├── Auth (/api/auth/*)
│   ├── Health (/api/health)
│   └── Protected (/api/protected/*)
│       ├── Profile (CRUD)
│       ├── Resume (parse, tailor, compile)
│       ├── AI (generate bullets, expand vault, select bullets)
│       ├── Chat (interact, save, history, clear)
│       └── History (list, get, delete, update)
│
└── Infrastructure
    ├── PostgreSQL (Prisma ORM)
    ├── Redis (BullMQ queue + rate limiting)
    ├── AI Service (OpenAI-compatible API)
    └── LaTeX (PDF compilation via pdflatex in Docker)
```

---

## 10. State Management

### Zustand Stores

#### `useChatStore`

| State | Type | Purpose |
|---|---|---|
| `messagesByMode` | `Record<ChatMode, ChatMessage[]>` | Independent message lists per mode |
| `currentPhase` | `OnboardingPhase` | Current onboarding step (GREETING → COMPLETE) |
| `isTyping` | `boolean` | AI response loading indicator |
| `mode` | `ChatMode` | Active chat mode |
| `extractedData` | `Record<string, unknown>` | Parsed profile data from AI responses |

**Key behaviors:**
- Adding messages appends to the current mode's history
- Phase transitions only occur when AI returns `intent: 'NAVIGATE'` + targetWidget
- Chat history loaded from backend on init per mode
- Messages persisted asynchronously after each interaction (fire-and-forget)

#### `useBuilderStore`

| State | Type | Purpose |
|---|---|---|
| `profile` | `Profile \| null` | Current profile for tailoring |
| `jobTitle`, `company`, `jobDescription` | `string` | Target job details |
| `selectedBulletIds` | `Record<string, string[]>` | Per-item selected bullet IDs |
| `selectedExperienceIds` | `string[]` | Included experience entries |
| `selectedProjectIds` | `string[]` | Included project entries |
| `selectedEducationIds` | `string[]` | Included education entries |
| `contactSelection` | `ResumeContactSelection` | Contact fields to include |
| `template` | `TemplateType` | Selected LaTeX template |
| `isCompiling` | `boolean` | Compilation in progress |
| `pdfUrl` | `string \| null` | Compiled PDF blob URL |
| `zoom` | `number` (50-200) | PDF viewer zoom level |
| `status` | `GenerationStatus` | Compile state machine |
| `currentStage` | `CurrentStage` | Builder workflow stage |

**Key behaviors:**
- `setProfile()` initializes all selections from profile data (all items/bullets selected by default)
- Toggle functions sort selections to maintain original order
- `triggerCompile()` orchestrates the 3-step compile flow: enqueue → poll → fetch blob
- AbortController cancels stale polling when re-triggered
- ObjectURL management (revoke previous, set new)

#### `useProfileStore`

| State | Type | Purpose |
|---|---|---|
| `profile` | `Profile` | Current profile (always valid, starts empty) |
| `originalProfile` | `Profile \| null` | Snapshot for dirty checking |
| `loading` | `boolean` | Initial load indicator |
| `saving` | `'idle' \| 'saving' \| 'saved' \| 'error'` | Save state machine |

**Key behaviors:**
- Auto-save with 500ms debounce on any mutation
- Dirty check via `fast-deep-equal` before saving
- Draft persisted to `localStorage` key `profile-draft`
- All CRUD methods (`addProject`, `deleteExperience`, `updateSkills`, etc.) trigger scheduleSave()

### Session Management

Handled by **BetterAuth**:
- Server-side: `getServerSession()` from `better-auth` server client
- Client-side: `useSession()` hook from `better-auth/react`
- Session data injected into Hono request context for protected routes
- Cookies: `better-auth.*` or `__Secure-better-auth.*` prefix

### Caching

No React Query, SWR, or other caching layer detected. All API calls are direct fetch requests. The only caching mechanism is:
- Server-side profile fetch on dashboard/tailor (Next.js server components)
- Zustand store persistence (in-memory, not persisted to storage except drafts)

---

## 11. UX Observations

### Current UX Patterns

1. **Chat-driven interaction model**: The primary UX paradigm is conversational AI. Users interact through a chat interface to build profiles, navigate the app, and trigger resume tailoring. This is unusual for a resume builder and signals an intentional design choice.

2. **Glassmorphism aesthetic**: Heavy use of backdrop-filter blur, semi-transparent backgrounds, subtle borders, and box-shadows create a layered, frosted-glass visual language. This is consistently applied across all authenticated pages.

3. **Staggered fade-up animations**: Content elements animate in with sequential delays (d1-d4), creating a cascading reveal effect. This pattern is used on the landing page, dashboard, and onboarding.

4. **Two-panel layouts**: Onboarding and tailor use split-screen layouts — chat on the left, preview/result on the right. This suggests a "conversation + live preview" interaction model.

### Interaction Model

- **Primary**: Text chat + AI responses
- **Secondary**: Form inputs (job description), checkboxes (bullet selection), drag-and-drop (file upload), clickable widgets
- **File upload**: Drag/drop or click-to-browse (PDF only, 5MB limit)
- **Theme toggle**: Moon/sun icon button (next-themes)

### Primary Workflow

1. Sign in → 2. Onboard (upload resume or chat) → 3. Edit Career Vault → 4. Enter job description → 5. AI selects bullets → 6. Toggle selections → 7. Preview PDF → 8. Compile/download

### Navigation Philosophy

- **Depth-first**: Users can only go deeper into features from the dashboard. The sidebar provides persistent top-level navigation.
- **Linear flows**: Onboarding and tailoring are wizard-like sequences without branching.
- **No breadcrumbs**: No way to see current location within a hierarchy.

### Mental Model

The application frames itself as a **"Career Vault"** — a single source of truth for professional experience. Users deposit their experience (via chat or upload), and the AI helps them withdraw relevant portions for specific job applications.

### Consistency

- **High**: Design tokens are consistently applied across CSS and Tailwind
- **High**: Glassmorphism is consistently used across all authenticated pages
- **Medium**: Some older components use different CSS variable naming (Field.tsx, BulletList.tsx)
- **Medium**: Error boundaries are consistently implemented per route group

### Component Reuse

- UI primitives are **custom-built** and reused (Button, Card, Input, Badge, Dialog, Progress)
- Chat widgets are **specialized per feature** (DashboardWelcome, TailorInput, ResumeUpload)
- Layout components are **reused** (Sidebar, AppLayout)

### Design Language

Dark, sophisticated, tech-forward with:
- Dark backgrounds (#09090b)
- Green accent (#16a34a) for primary actions and highlights
- Glass panels with backdrop blur
- Monospace font (JetBrains Mono) for code elements
- Custom display fonts (Cabinet Grotesk, Satoshi)
- Subtle gradient orbs in backgrounds
- Floating decorative animations

### Complexity

- **High backend complexity**: AI integration, async PDF compilation via BullMQ, rate limiting, session management, multi-route architecture
- **Medium frontend complexity**: Zustand state machines, chat system, file upload, PDF preview, auto-save drafts
- **High for users unfamiliar with AI chat**: The chat-driven model may be disorienting for users expecting traditional form-based profile builders

### Discoverability

- **Low**: No onboarding tour, tooltips, or empty-state guidance beyond the initial chat greeting
- **Medium**: Quick action cards on dashboard provide navigation shortcuts
- **Low**: The chat input has no placeholder guidance until the user starts typing
- **Low**: Keyboard shortcuts are absent

---

## 12. Screenshots

> Screenshots should be placed in `docs/screenshots/`. Name them consistently as:
>
> - `landing-page.png` — Landing page
> - `onboarding-chat.png` — Onboarding chat panel
> - `onboarding-preview.png` — Onboarding split-screen preview
> - `dashboard-overview.png` — Dashboard with widgets
> - `profile-vault.png` — Career Vault profile editor
> - `tailor-input.png` — Job description entry
> - `tailor-selection.png` — Bullet selection UI
> - `tailor-preview.png` — Live PDF preview
> - `history-list.png` — Tailoring history

---

## 13. Executive Summary

### Current Product Structure

Resumint is a **monorepo application** (Next.js 16 frontend + Hono backend) that provides AI-powered resume tailoring through a **chat-driven interface**. It is deployed across Vercel (frontend) and Render (backend + Redis + PostgreSQL).

### Major Features

| Feature | Status | Notes |
|---|---|---|
| Google OAuth sign-in | Implemented | BetterAuth |
| Chat-based onboarding | Implemented | Two-path: upload PDF or describe |
| PDF resume parsing | Implemented | AI extracts structured data |
| Career Vault / Profile CRUD | Implemented | Auto-save, drafts, dirty checking |
| AI bullet generation | Implemented | Per-section AI content generation |
| AI vault expansion | Implemented | Brief → 12 bullets |
| AI bullet selection (tailoring) | Implemented | Matches vault to job description |
| LaTeX PDF compilation | Implemented | Async via BullMQ + redis |
| Live PDF preview | Implemented | Poll-based compile + blob URL |
| Tailoring history | Implemented | List, view, delete |
| GitHub repo import | Implemented | README → AI bullets |
| Resume templates | 4 templates | nsut-canonical, ats-clean, modern, compact |
| Dashboard sub-pages | 6 pages | All marked "Coming Soon" |
| URL scraping | Implemented | Jina AI reader for GitHub/portfolio URLs |

### Main Workflows

1. **Sign in → Onboard** (upload PDF or chat) → **Dashboard**
2. **Dashboard** → **Career Vault** (edit profile, auto-save)
3. **Dashboard** → **Tailor** (enter JD → AI select → toggle → compile PDF)
4. **Dashboard** → **History** (review past tailored resumes)

### UI Architecture

- **Framework**: Next.js 16 App Router (React 19)
- **Styling**: Tailwind CSS v4 with custom dark-only design tokens
- **Components**: Custom-built UI library (no external component library)
- **State**: Zustand 5 (3 stores: chat, builder, profile)
- **Layout**: Persistent sidebar (240px) + main content area
- **Auth**: BetterAuth with Google OAuth
- **API**: Hono RPC client (type-safe) with cookie-based auth

### UX Architecture

- **Primary interaction**: Chat-based AI conversation
- **Visual identity**: Dark glassmorphism with green accent
- **Animations**: Staggered fade-up reveal, floating orbs, shimmer loading
- **Layout patterns**: Split-screen (chat + preview), card grids, sidebar navigation
- **Feedback**: Toast notifications (sonner), typing indicators, loading spinners
- **Error handling**: Error boundaries per route group with retry buttons

### Component Hierarchy

```
AppLayout
├── Sidebar (persistent navigation)
└── Page Content
    ├── Landing (/)
    │   └── SignInButton
    │   └── Navigation Cards
    ├── Onboarding (/onboarding)
    │   ├── ChatContainer
    │   │   ├── MessageBubble
    │   │   │   └── ResumeUploadWidget (in chat)
    │   │   └── ...
    │   ├── ChatInput
    │   └── OnboardingPreviewPanel
    ├── Dashboard (/dashboard)
    │   └── Dashboard*Widgets
    ├── Profile (/profile)
    │   └── Profile editor fields
    ├── Tailor (/tailor)
    │   ├── ChatContainer (with widgets)
    │   │   ├── TailorInputWidget
    │   │   ├── Selection checkboxes
    │   │   └── ...
    │   ├── LivePdfRenderer
    │   └── Splitter
    └── History (/history)
        └── History list items
```

### Design Philosophy (Inferred)

From the implementation, the design philosophy appears to be:
1. **Conversation-first**: Chat is not a feature; it IS the interface
2. **Glassmorphism**: Visual depth through frosted glass layers
3. **Dark-only**: Attitude of "dark mode is the default, not an option"
4. **Green accent**: Growth, success, and ATS-passing confidence
5. **Staggered reveals**: Content should animate in sequentially, never all at once
6. **Type-first**: Custom display fonts, careful typography hierarchy

### Known Inconsistencies (Factual Observations)

1. **Light theme incomplete**: `next-themes` and `ThemeToggle` exist but only dark mode design tokens are defined in CSS. Activating light mode would produce broken visuals.
2. **CSS variable naming mismatch**: `Field.tsx` and `BulletList.tsx` use older CSS variable names (`--border` instead of `--edge`, `--muted-foreground` instead of `--content-muted`) that don't match the current design token system.
3. **Dashboard ATS score hardcoded**: The ATS score widget displays a hardcoded 82% with no actual scoring logic.
4. **"Coming Soon" pages**: 6 dashboard sub-pages exist as shells with "Coming Soon" badges. They are accessible via direct URL navigation but have no functional purpose.
5. **Dashboard chat vs. widget rendering**: The dashboard page renders widgets directly (not through the chat), but also has a `DashboardChatClient` that adds messages to the chat store. This is a dual-rendering pattern where the same data is shown through both chat messages and direct component rendering.
6. **Old `/dashboard/profile` redirect**: The `/dashboard/profile` route simply redirects to `/profile` — legacy route preserved for backward compatibility.
7. **`/tailor/builder` redirect**: The old builder URL redirects to `/tailor` via proxy middleware.

### Unknown Areas (Cannot Be Inferred From Code)

- Whether light mode was intentionally left incomplete or is still in progress
- The intended content/functionality of the 6 "Coming Soon" dashboard pages
- How the sidebar "Settings" link is expected to work (it links to `/dashboard/settings` which is "Coming Soon")
- The `/tips` page content
- Whether there are actual ATS scoring algorithms planned or the 82% is a perpetual placeholder
- Mobile responsive behavior beyond basic grid changes (cannot verify without running)
- Real-world performance of the PDF compilation pipeline
- Error rates and edge cases in AI responses
- Whether the chat's lack of message truncation causes issues with long conversations
- The actual accessibility compliance level (WCAG conformance cannot be verified from code alone)
