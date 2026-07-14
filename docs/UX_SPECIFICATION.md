# Resumint — UX Specification

> **Author:** Lead Product Architect
> **Status:** Design Specification
> **Audience:** Engineering team implementing the Workspace, chat interactions, and resume flow
> **Source:** CHANGE_PLAN.md product vision, existing codebase patterns, architectural feedback

---

## Table of Contents

1. [Workspace Screen — Every State](#1-workspace-screen--every-state)
2. [Header & Navigation](#2-header--navigation)
3. [Chat Interaction Patterns](#3-chat-interaction-patterns)
4. [Resume Panel Behavior & States](#4-resume-panel-behavior--states)
5. [Flow: Paste JD → Download Resume](#5-flow-paste-jd--download-resume)
6. [Proposal Cards — Interaction Design](#6-proposal-cards--interaction-design)
7. [Memory Browser UX](#7-memory-browser-ux)
8. [History Page UX](#8-history-page-ux)
9. [Micro-interactions & Transitions](#9-micro-interactions--transitions)
10. [Responsive Behavior](#10-responsive-behavior)
11. [Copy & Error States](#11-copy--error-states)
12. [Onboarding Flow](#12-onboarding-flow)
13. [Merge Suggestion](#13-merge-suggestion)
14. [GitHub Import — Flagship Feature](#14-github-import--flagship-feature)
15. [System Confidence](#15-system-confidence)
16. [Resume Fit Score](#16-resume-fit-score)

---

## 1. Workspace Screen — Every State

### 1.1 Design Philosophy

The Workspace is the product. Users spend 95% of their time here. Navigation is deliberately invisible — there is no sidebar, no tab bar, no secondary navigation. The only persistent elements are the **logo** (top-left), the **current draft title** (center), and the **avatar** (top-right). Everything else — Memory, History, Settings — opens from a command menu triggered by `Cmd+K` or clicking the logo area.

This is Claude-inspired minimalism. The less chrome, the more immersive the experience feels.

### 1.2 Layout at Rest (Empty State)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [◆]                                        [Google — BE]      [👤] │
├────────────────────────────────┬─────────────────────────────────────┤
│                                │                                      │
│   CHAT PANEL (centered)        │   RESUME PANEL                       │
│   max-w-[640px]               │                                      │
│                                │   ┌──────────────────────────────┐  │
│   ┌────────────────────────┐  │   │                              │  │
│   │                        │  │   │     Your resume will appear   │  │
│   │   Welcome to Resumint  │  │   │        here once you          │  │
│   │                        │  │   │      generate your first      │  │
│   │   Start by pasting a   │  │   │          resume.              │  │
│   │   job description or   │  │   │                              │  │
│   │   describing what you  │  │   │    [Get Started]             │  │
│   │   want to build.       │  │   │                              │  │
│   │                        │  │   └──────────────────────────────┘  │
│   │   [Paste JD or type...]│  │                                      │
│   │                        │  │                                      │
│   └────────────────────────┘  │                                      │
│                                │                                      │
│   [ suggested prompts ]       │                                      │
│                                │                                      │
└────────────────────────────────┴──────────────────────────────────────┘
```

**What's NOT here:**
- No "Workspace" nav link — you're already here
- No "Memory" nav link — accessed via `Cmd+K`
- No "History" nav link — accessed via `Cmd+K`
- No sidebar — removed entirely
- No theme toggle — lock to dark mode
- No settings gear — accessed via avatar dropdown + `Cmd+K`

**What IS here:**
- Logo (◆) — top-left, click to toggle command menu
- Draft title — center, only visible when a draft is active
- Avatar — top-right, dropdown for sign-out + settings
- Chat panel — centered, the primary interface
- Resume panel — right side, the secondary view

### 1.3 States

#### A. Empty State (no active draft, no Career Memory)

- **AI greeting:** "Welcome to Resumint. I don't see any Career Memory yet. Let's build it together."
- **Suggested prompts:** Clickable chips below input
  - "Upload my resume to get started"
  - "I built a project using..."
  - "I worked at a company as a..."
  - "Import a GitHub repository"
- **Resume panel:** Empty state illustration: "Your resume will appear here"
- **Header:** Logo only (left). Avatar only (right). No draft title.

#### B. Empty State (has Career Memory, no active draft)

- **AI greeting:** "Welcome back. You have 4 experiences and 3 projects in your Career Memory. Paste a job description to create a tailored resume."
- **Suggested prompts:**
  - "Create a resume for a role"
  - "Show me my Career Memory"
  - "Add a new project I've been working on"
- **Resume panel:** Same empty state as A.

#### C. Active Chat (user typing)

- Input centered, placeholder: "Paste a job description or tell me what you've worked on..."
- Input expands 1 → 6 lines. Send button (green circle, ArrowUp) appears when text is present.
- Paste detection: GitHub URL → brief "Importing repository..." flash
- Resume panel: Unchanged until AI responds.

#### D. AI Generating

- Three bouncing dots in chat. Descriptive text below: "Analyzing job description..."
- Resume panel: Subtle shimmer sweep. "Analyzing..."
- Input disabled. Send button disabled.

#### E. AI Responded (proposal cards visible)

- AI response: text + inline cards. One card per entry or selection.
- Cards are inline chat messages — inline editable, not modals.
- Selection cards show confidence bars and entry summaries.
- **Resume panel:** Shows auto-generated first pass of the resume if a draft was auto-created. If user hasn't confirmed, panel shows: "Confirm selections to generate your resume."
- **Selection panel is hidden.** The "panel" concept is gone. Selections appear inside the chat as cards. The right side is always the Resume.

#### F. Resume Ready

- Resume panel shows the compiled PDF.
- Chat shows: "Your resume is ready."
- Header shows draft title: "Google — Backend Engineer"
- Download button appears next to the draft title in the header.
- Suggested prompts update: "Download", "Duplicate", "Try another template"

#### G. Compiling

- Resume panel: Centered spinner + "Compiling your resume..."
- Status stages: Queued → Compiling → Ready (shown as connected dots)
- Chat remains interactive. User can start another conversation while waiting.

#### H. Error

- AI error: "I had trouble analyzing that. Could you paste the job description again?"
- Compile error: Resume panel shows error state with "Retry" button. Details never shown to user.
- Network error: Sonner toast. "Couldn't connect to the server."

#### I. Active Draft (returning user)

- If user returns to a draft, the Workspace restores:
  - Last 10 chat messages from that session
  - The compiled PDF (or "recompile" prompt if stale)
  - Draft title in center of header
  - Stale badge if memory has changed since draft creation

---

## 2. Header & Navigation

### 2.1 The Command Menu

The command menu is the primary navigation mechanism. It is inspired by the Claude command palette and Notion's quick find.

**Trigger:**
- `Cmd+K` (Mac) / `Ctrl+K` (Windows) — from anywhere in the app
- Click on the logo (◆)
- Click on a dedicated `Cmd+K` hint element in the header

**Menu content:**

```
┌──────────────────────────────────────┐
│  🔍 Quick navigation...              │
│                                      │
│  Recent                              │
│  ├─ Google — Backend Engineer        │
│  └─ Stripe — Senior Backend Engineer │
│                                      │
│  Pages                               │
│  ├─ ⌘1  Workspace                   │
│  ├─ ⌘2  Career Memory               │
│  ├─ ⌘3  History                     │
│  └─ ⌘4  Settings                    │
│                                      │
│  Actions                             │
│  ├─ New Resume Draft                 │
│  ├─ Import from GitHub               │
│  └─ Export Career Memory             │
└──────────────────────────────────────┘
```

**Keyboard shortcuts (shown in the menu):**
- `⌘1` — Workspace
- `⌘2` — Career Memory
- `⌘3` — History
- `⌘4` — Settings

The menu is searchable — typing filters all items. `Esc` closes it.

### 2.2 Header Structure (Minimal)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [◆]  (click → Cmd+K)     [Google — Backend Engineer]         [👤] │
│                                       [Template ▾] [↓ Download]     │
└──────────────────────────────────────────────────────────────────────┘
```

**Left:** Logo. Click opens command menu. `Cmd+K` also works.

**Center:** Draft title (only when a draft is active). Conditionally, a thin sub-row with Template selector + Download button appears below. This sub-row is subtle (`text-sm`, `text-content-muted`).

**Right:** Avatar. Click opens dropdown: Settings, Sign Out.

### 2.3 What Was Removed

| Old Element | Removed? | Replacement |
|---|---|---|
| Sidebar | ✓ Removed | Command menu |
| Workspace nav link | ✓ Removed | You're already here |
| Memory nav link | ✓ Removed | `Cmd+K` or `⌘2` |
| History nav link | ✓ Removed | `Cmd+K` or `⌘3` |
| Theme toggle | ✓ Removed | Dark mode only |
| Settings gear | ✓ Removed | Avatar dropdown + `Cmd+K` |

### 2.4 Other Pages (Memory, History, Settings)

These pages have their own minimal headers consistent with the Workspace:

```
[◆]                    Career Memory               [👤]
[◆]                    History                     [👤]
[◆]                    Settings                    [👤]
```

Each has a simple "Page title" in the center. Logo opens command menu. `Cmd+K` works from every page. No sub-navigation.

---

## 3. Chat Interaction Patterns

### 3.1 Chat Owns Everything

The chat is the **sole primary interface**. The Resume panel on the right is secondary. There is no "selection panel" as a persistent UI element.

**Visual hierarchy:**
```
Primary:  Chat (center, 55-65% width)
Secondary: Resume (right, 35-45% width)
Hidden:    Selection view (only appears inline within chat, never as a panel)
```

**When selections appear:**
- AI finishes analyzing JD → returns selections as chat cards (inline, within the conversation)
- User sees entries with confidence bars inside the chat message
- User can expand a card to see individual bullets
- User toggles bullets inline (within the card)
- No separate panel, no sidebar, no drawer

**The rule:** If the AI doesn't need confirmation, the chat just shows the result. The selection view only appears when the AI needs user input — confirmation, disambiguation, or correction.

### 3.2 Message Types

| Type | Appearance | Behavior |
|---|---|---|
| **User text** | Left-aligned, white on `bg-muted`, rounded-2xl, max-w-[80%] | Fades into scroll history |
| **AI text** | Left-aligned, white, no background, full width | Fade-up animation |
| **AI proposal card** | Glass card (`bg-card/80`, border-edge), full width in max-w-[640px] | Scale-in + fade-up. Action buttons: Confirm, Edit, Reject |
| **AI selection card** | Similar to proposal card, but shows entry list with confidence bars | Expandable. Click an entry to see bullets. Toggle bullets inline. "Generate Resume" button at bottom |
| **AI search results** | Inline compact cards in vertical list | Each clickable → navigates to memory entry |
| **System message** | Centered, muted, small font | Status updates: "Draft created", "Compilation complete" |

### 3.3 Input Behavior

| State | Appearance |
|---|---|
| Empty | "Paste a job description or tell me what you've worked on..." |
| Typing | Expands to 6 lines max. Send button appears |
| Disabled (AI generating) | Grayed out, disabled, "..." |
| Has draft | "Ask me anything about your Career Memory..." |
| Pasted GitHub URL | Brief "Importing repository..." flash |
| File dropped | File chip with progress bar |

**Keyboard:**
- `Enter` = Send
- `Shift+Enter` = New line
- `ArrowUp` = Edit last user message
- `Escape` = Clear input

### 3.4 Suggested Prompts

Shown below the input when:
- Workspace is empty
- Workspace has been idle >30s
- A draft was just completed

Prompts adapt to context. Clickable chips that populate input directly.

**No draft, no memory:** "Upload my resume", "I built a project...", "I worked at...", "Import a GitHub repo"

**No draft, has memory:** "Create a resume for a role", "Show me my Career Memory", "Add a new project"

**Draft active:** "Add this to my memory", "What skills am I missing?", "Create another resume"

**Just compiled:** "Download the PDF", "Duplicate and try another template"

### 3.5 Typing Indicator

Three bouncing dots with descriptive text:

- JD analysis: "Analyzing job description..."
- Entry selection: "Selecting the best matches from your Career Memory..."
- Draft creation: "Building your resume..."
- Memory operation: "Updating your Career Memory..."
- GitHub import: "Importing repository..."
- Merge suggestion: "Checking if this relates to existing entries..."

### 3.6 Chat Draft Persistence

Input draft saved to `localStorage` (`workspace-chat-draft`). Restored on return. Cleared on send.

---

## 4. Resume Panel Behavior & States

### 4.1 Renamed: "Resume" not "Preview"

The right panel is called **Resume**, not PDF Preview or similar. This is deliberate psychology:

- **"Preview"** implies "this isn't finished yet"
- **"Resume"** implies "the product created something real"

The user should feel like the Resume already exists. They're just looking at it.

### 4.2 Panel Layout

```
┌─────────────────────────────────────┐
│ [●] Ready            85% [−] [+] [↓]│  ← toolbar, h-[40px]
├─────────────────────────────────────┤
│                                     │
│            PDF IFRAME               │
│    (or placeholder/error state)     │
│                                     │
└─────────────────────────────────────┘
```

**Toolbar:**
- **Status dot**: Green = ready, Yellow = compiling, Gray = empty, Red = error
- **Zoom**: Percentage + [-] [+] controls
- **Download**: ↓ icon. Active only when Resume is ready.

### 4.3 States

#### A. Empty (no draft)

```
[●]                                          [↓]
───────────────────────────────────────────────
               ┌──────────────────────┐
               │                      │
               │  Your resume will    │
               │  appear here once    │
               │  you generate one.   │
               │                      │
               │   [Generate Resume]  │
               │                      │
               └──────────────────────┘
```
- Status dot: Gray
- Download: Disabled
- Center: Glass card with icon + CTA

#### B. Compiling

```
[●] Compiling...                        [↓]
───────────────────────────────────────────────
                   ◌ ◌ ◌
           Compiling your resume...
        Queued → Compiling → Done
```
- Status dot: Yellow
- Spinner + stage indicator
- Download: Disabled

#### C. Ready

```
[●] Ready            85% [−] [+] [↓]
───────────────────────────────────────────────
      ┌──────────────────────────────┐
      │                              │
      │     Embedded PDF iframe      │
      │     #toolbar=0               │
      │                              │
      └──────────────────────────────┘
```
- Status dot: Green
- Zoom range: 50-200%
- Download: Active. File name: `{Company}_{Role}_{Date}.pdf`

#### D. Error

```
[●] Error                              [↓]
───────────────────────────────────────────────
               ┌──────────────────────┐
               │  ⚠ Failed to        │
               │  compile resume      │
               │                      │
               │      [Retry]         │
               └──────────────────────┘
```
- Status dot: Red
- Error details suppressed. Retry button.

### 4.4 Auto-compile Behavior

- 800ms debounce after selections change
- Small "Auto-compiling" indicator in toolbar during debounce
- Changes during debounce window reset the timer
- No auto-compile on first draft creation (user must click "Generate Resume")

---

## 5. Flow: Paste JD → Download Resume

This is the primary user flow. Every step below.

### Step 0: Pre-condition

User is authenticated. Career Memory has entries.

### Step 1: User arrives at Workspace

**What they see:**
- Centered chat. Minimal header: logo + avatar.
- AI greeting with suggested prompts.
- Resume panel empty on the right.

### Step 2: User pastes JD

User pastes a job description or types "Create a resume for Senior Backend Engineer at Stripe".

If a URL is pasted, the backend fetches content automatically.

### Step 3: AI responds with selection card (inline in chat)

```
┌──────────────────────────────────────────────┐
│  AI:                                           │
│  I've analyzed the Stripe Senior Backend       │
│  Engineer role.                                │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Required: Java, Distributed Systems,    │ │
│  │  PostgreSQL, Kafka, AWS                  │ │
│  │                                          │ │
│  │  Experience (3)                          │ │
│  │  Sr BE @ Coinbase    ████████░░  0.92   │ │
│  │  BE @ Uber           ██████░░░░  0.78   │ │
│  │  SWE @ Microsoft     ████░░░░░░  0.45   │ │
│  │                                          │ │
│  │  Projects (2)                            │ │
│  │  Dist Task Queue     ████████░░  0.88   │ │
│  │  Payment Gateway     ██████░░░░  0.71   │ │
│  │                                          │ │
│  │  Skills: Java, Go, Kafka, PostgreSQL     │ │
│  │                                          │ │
│  │  Template: [ats-clean ▾]                │ │
│  │                                          │ │
│  │  [Generate Resume]                       │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```
- Confidences are visual bars with subtle numeric label (system confidence, not AI confidence)
- Clicking an entry expands it to show individual bullets (inline, within the card — no panel opens)
- Template dropdown has 4 options
- "Generate Resume" is the primary CTA

### Step 4: User clicks "Generate Resume"

1. `POST /api/protected/resume-drafts` — creates draft with frozen selections
2. `POST /api/protected/resume/compile-live` — queues compilation
3. Poll for status every 800ms
4. Resume panel transitions: Empty → Compiling → Ready

**During compile:**
- Button becomes disabled with spinner
- Resume panel shows "Compiling your resume..."
- Chat shows: "Building your resume..."
- On complete: "Resume created successfully" + draft title appears in header

### Step 5: Resume appears in right panel

**What the user sees:**
- The compiled PDF fills the right panel
- Header shows draft title: "Stripe — Senior Backend Engineer"
- Download button appears
- Chat shows: "Your resume is ready."
- Suggested prompts update: "Download", "Duplicate", "Try another template"

### Step 6: Resume Fit Score appears

Below the chat success message, a deterministic analysis card:

```
┌──────────────────────────────────────────────┐
│  Resume Fit: 85%                              │
│                                                │
│  Matched                                      │
│  ✓ Java (Experience: Coinbase, Uber)          │
│  ✓ PostgreSQL (Skill)                         │
│  ✓ Kafka (Project: Dist Task Queue)           │
│  ✓ AWS (Experience: Uber)                     │
│                                                │
│  Not Matched                                  │
│  ✗ Distributed Systems (Missing from memory)  │
│                                                │
│  [Add Missing Skills to Memory]               │
└──────────────────────────────────────────────┘
```

### Step 7: User actions

| Action | Behavior |
|---|---|
| **Download** | Downloads as `Stripe_Senior_Backend_Engineer_2026-03-15.pdf`. Toast confirms. |
| **Edit selections** | Click an entry in the selection card → expand → toggle bullets. Auto-compile after 800ms. |
| **Change template** | Dropdown in header. Auto-compile after 800ms. |
| **Duplicate** | Header ⋮ menu → new draft with same selections + "(Copy)" |
| **Add missing skills** | Click "Add Missing Skills to Memory" → AI proposes adding them → confirm |
| **Cmd+K → New Draft** | Starts fresh. Current draft auto-saved. |

### Step 8: Return visit

- Latest draft restored as active
- Last 10 chat messages loaded
- PDF appears if compiled (stale indicator if memory changed)
- No draft → empty state

---

## 6. Proposal Cards — Interaction Design

### 6.1 Card Structure

```
┌──────────────────────────────────────────────────┐
│ [Badge: New Experience]                           │
│                                                    │
│ Microsoft — SWE Intern                            │
│ Summer 2025 · Redmond, WA                         │
│                                                    │
│ ├─ Developed features for Azure Cognitive Services │
│ ├─ Reduced API latency by 40%                     │
│ └─ Collaborated across 3 teams                    │
│                                                    │
│ Skills: TypeScript, Azure, REST APIs              │
│                                                    │
│ ┌───────────┐ ┌──────┐ ┌────────┐                │
│ │ Save All  │ │ Edit │ │ Reject │                │
│ └───────────┘ └──────┘ └────────┘                │
└──────────────────────────────────────────────────┘
```

### 6.2 Action Behaviors

| Action | Behavior |
|---|---|
| **Save All** | Green button. Saves all. Card collapses to: "✓ Saved — Microsoft SWE Intern" |
| **Edit** | Outline button. Opens inline editing. Fields become editable. "Save" replaces "Save All". "Cancel" appears. |
| **Reject** | Ghost button, subtle red on hover. Card fades out. Undo toast for 5s. |

### 6.3 Inline Editing

When user clicks "Edit":
- Fields become contenteditable inline (not a modal, not a separate page)
- Bullets: add, edit, delete inline
- Skills: toggle on/off
- Cancel reverts all changes
- Save saves with modifications

### 6.4 Card Types

| Type | Purpose | Trigger |
|---|---|---|
| **New Entry** | Create a memory entry | User describes experience |
| **Update Entry** | Modify existing entry | "Update the Microsoft end date" |
| **Delete Entry** | Remove an entry | "Remove that old project" |
| **Selection** | Resume entry selection | After JD analysis |
| **Merge Suggestion** | Suggest merging into existing | New entry detected as related |
| **Import Result** | Imported data summary | After GitHub/PDF import |
| **Bulk Import** | Multiple entries | After PDF upload |

### 6.5 Merge Suggestion Card

When AI detects a new entry might belong to an existing one:

```
┌──────────────────────────────────────────────────┐
│ I noticed this sounds related to your existing    │
│ "Poker AI" project.                               │
│                                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ ● Create as a New Project (currently shown)  │ │
│ │ ○ Merge into "Poker AI" as an additional     │ │
│ │   experience/bullet                          │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ [Save as New] [Merge into Poker AI]               │
└──────────────────────────────────────────────────┘
```

The merge operation:
1. Takes the content of the new entry
2. Adds it as additional bullets to the existing entry
3. Updates tags/skills from the new content
4. Preserves source attribution for both original and merged content

### 6.6 Confirmation Pattern

All AI-initiated mutations: AI returns `MemoryAction[]` → frontend renders cards → user acts → backend applies. No database writes without confirmation.

---

## 7. Memory Browser UX

### 7.1 Layout (Notion-Style)

```
┌──────────────────────────────────────────────────────┐
│ [◆]                   Career Memory              [👤] │
├──────────────────────────────────────────────────────┤
│                                                        │
│  [🔍 Search titles, skills, companies...        ]     │
│                                                        │
│  Recent    Pinned    Everything                         │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Microsoft — SWE Intern                          │  │
│  │ Experience · Summer 2025 · 3 bullets            │  │
│  │ Azure, TypeScript, REST APIs                    │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Distributed Task Queue                          │  │
│  │ Project · Go, Kafka · 5 bullets                 │  │
│  │ ⭐ Pinned                                       │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ B.Tech Computer Science — NSUT                  │  │
│  │ Education · 2022-2026 · GPA: 8.5                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  [Load More...]                                        │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Notable differences from a CRUD layout:**
- **No type tabs at top** — filters are: Recent, Pinned, Everything
- **Everything** is the default — clicking it shows a type filter dropdown: Projects, Experience, Education, Skills, Certificates, Achievements
- **Search** is instant (300ms debounce), full-text across all fields
- **Pinned entries** appear at the top of any view. Pin/unpin via entry detail view or right-click.
- **Recent** shows entries by last-updated date. This is the default view.

### 7.2 Search Behavior

- Full-text across titles, companies, skills, bullet text, tags, source URLs
- Instant — results update as user types (300ms debounce)
- Scoped to active filter (if user is viewing pinned, search searches pinned)
- Empty search: "No results found for '{query}'. Try a different search term."
- Empty memory: "Your Career Memory is empty. Start by telling me about your experience in the Workspace."

### 7.3 Entry Card

Each card shows:
- **Title**: Bold
- **Type + metadata**: "Experience · Summer 2025 · 3 bullets"
- **Tags/skills**: Muted text on second line
- **Pinned indicator**: ⭐ if pinned
- **Click**: Opens entry detail view

### 7.4 Entry Detail View

- URL: `/memory/:type/:id`
- Full edit form with type-specific fields
- Source attribution footer (read-only): "Imported from GitHub — March 10, 2026"
- Bullet editor (same VaultBullet pattern — add, edit, delete)
- Auto-save with 500ms debounce
- Delete with confirmation
- Pin/Unpin toggle

### 7.5 Empty & Error States

- **No entries**: Illustration + text + CTA: "Build your Career Memory in the Workspace"
- **Search no results**: "No results for '{query}'"
- **Load failure**: Toast + retry

---

## 8. History Page UX

### 8.1 Layout

```
┌──────────────────────────────────────────────────────┐
│ [◆]                       History                [👤] │
├──────────────────────────────────────────────────────┤
│                                                        │
│  [🔍 Search by company, title, or role...       ]     │
│                                                        │
│  [All] [Recently Compiled] [Drafts Only]               │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ Google — Backend Engineer                     │     │
│  │ March 15, 2026 · ats-clean                    │     │
│  │ 3 experiences · 2 projects · ● Ready         │     │
│  │ [Open] [Duplicate] [Delete]                   │     │
│  └──────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────┐     │
│  │ Stripe — Senior Backend Engineer             │     │
│  │ March 10, 2026 · modern                      │     │
│  │ 4 experiences · 3 projects · ● Ready  ⚠ Stale│     │
│  │ [Open] [Duplicate] [Delete]                   │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  [Load More...]                                        │
└──────────────────────────────────────────────────────┘
```

### 8.2 Actions

| Action | Behavior |
|---|---|
| **Open** | `/workspace?draft={id}` — restores draft |
| **Duplicate** | New draft from same selections + "(Copy)" |
| **Delete** | Confirmation dialog → undo toast for 5s |

Stale drafts show a warning icon. Opening shows banner: "This draft references entries that changed. [Refresh Selections]"

---

## 9. Micro-interactions & Transitions

### 9.1 Page Transitions

| Transition | Duration | Easing |
|---|---|---|
| Page load | 400ms | ease-out-expo |
| Route change | 200ms | ease-out |
| Command menu open | 150ms | scale-in |

### 9.2 Chat Transitions

| Element | Duration |
|---|---|
| User message appearing | 150ms slide-up |
| AI message appearing | 200ms slide-up + fade |
| Proposal card entering | 250ms scale (0.97→1) + fade-up |
| Proposal card leaving (rejected) | 200ms fade-out |
| Typing indicator | Continuous bounce |

### 9.3 Resume Panel Transitions

| Change | Animation |
|---|---|
| Empty → Compiling | Spinner fades in, placeholder out |
| Compiling → Ready | Spinner out, iframe fades in (0.97→1, 300ms) |
| Compiling → Error | Spinner out, error state in (200ms) |
| PDF replaced | 150ms crossfade |
| Status dot change | 300ms color transition |

### 9.4 Global Micro-interactions

- Button press: `scale(0.97)` for 100ms
- All interactive elements: `transition-colors duration-150`
- Header nav active: bold + 2px bottom border (brand)
- `prefers-reduced-motion`: disables all animations

### 9.5 Loading Skeletons

- Chat history: 3 placeholder bubbles (shimmer)
- Memory list: 4 card skeletons (shimmer, staggered)
- History list: 3 card skeletons (shimmer, staggered)
- Resume panel: Full-panel shimmer (subtle gradient sweep)

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Desktop (≥1024px) | Full split: Chat (centered, max-w-640) + Resume (right, 45%) |
| Tablet (768-1023px) | Stacked: Chat on top (max-h-[60vh]), Resume below |
| Mobile (<768px) | Single panel: Chat full height. Resume via floating "View Resume" tab → fullscreen overlay |

**Mobile touch:**
- Swipe left on card = Reveal "Reject" (red)
- Swipe right = Reveal "Save" (green)
- Long press = Context menu
- Pinch = Zoom on Resume

**Keyboard (desktop):**
- `Cmd+K` / `Ctrl+K` = Command menu
- `⌘1`-`⌘4` = Page shortcuts
- `Enter` = Send
- `Shift+Enter` = New line
- `ArrowUp` = Edit last message
- `Escape` = Close menu/dialog/card

---

## 11. Copy & Error States

### 11.1 System Messages

| Context | Message |
|---|---|
| Greeting (no memory) | "Welcome to Resumint. I don't see any Career Memory yet. Let's build it together." |
| Greeting (has memory) | "Welcome back. You have {count} entries in your Career Memory." |
| Draft created | "Resume draft created." |
| Draft compiled | "Your resume is ready." |
| Memory updated | "Updated — this applies to future resumes." |
| Entry saved | "Saved to Career Memory." |
| Draft stale | "This draft references entries that changed. [Refresh Selections]" |

### 11.2 Error Messages

| Context | Message | Action |
|---|---|---|
| AI analysis failed | "I had trouble analyzing that. Could you rephrase?" | User retypes |
| Compile failed | "Compilation failed. This is usually temporary." | Retry button |
| Save failed | "Couldn't save — try again." | Retry button |
| Network error | "Couldn't connect. Check your internet." | Retry button |
| Auth expired | "Session expired. Sign in again." | Sign in button |
| Rate limited | "Too many requests. Wait a moment." | Wait message |

### 11.3 Empty States

| Page | Message | CTA |
|---|---|---|
| Workspace (no memory) | "Let's build your Career Memory." | Suggested prompts |
| Workspace (has memory) | "Paste a job description to start." | Suggested prompts |
| Memory (no entries) | "Start in the Workspace." | Cmd+K hint |
| History (no drafts) | "No drafts yet." | Cmd+K hint |
| Search (no results) | "No results for '{query}'" | Clear search |

### 11.4 Confirmation Dialogs

| Action | Message |
|---|---|
| Delete entry | "Delete this {type}? Past drafts keep their data." |
| Delete draft | "Delete this draft? Can't undo." |
| Reject all | "Reject all pending changes?" |
| Sign out | "Sign out?" |

---

## 12. Onboarding Flow

### 12.1 No Onboarding Page

There is no `/onboarding` page. The user lands in the Workspace after sign-in. The AI handles the "no memory" state conversationally.

```
User signs in (0 entries in Career Memory)
    ↓
Redirected to /workspace
    ↓
AI: "Welcome to Resumint! I don't see any Career Memory yet.
     Let's build it together. You can:
     
     • Upload your resume — I'll extract everything
     • Tell me about your experience — I'll add it as we talk
     • Import a GitHub repository
     • Start with a blank slate
     
     What works best for you?"
```

### 12.2 Redirect Logic

After sign-in:
- `GET /api/protected/memory/count` → 0 entries → `/workspace` with onboarding greeting
- Entries exist → `/workspace` with normal greeting

### 12.3 PDF Upload

When user opts to upload a PDF:
1. File picker (accept: `.pdf`, max 10MB)
2. `POST /api/protected/resume/parse`
3. Backend extracts text → AI parses into domain-typed entries
4. Returns `MemoryAction[]` — one per entry
5. Each entry = proposal card in chat
6. User confirms/rejects individually or "Save All"

---

## 13. Merge Suggestion

### 13.1 Concept

When the AI detects that a new entry might relate to an existing one, it proposes a merge. This is a unique feature — no other resume tool suggests merging entries.

### 13.2 Trigger

Merge suggestion triggers when:
- User describes a project that shares tech stack, domain, or name with an existing entry
- A GitHub import produces a project similar to an existing one
- User adds a detail that could be a bullet point belonging to an existing entry

### 13.3 Detection

The retriever (deterministic, no AI cost) handles the initial detection:
1. Extract keywords from the new content
2. Search existing memory for matching title, tech stack, tags
3. If match score > threshold (0.7), flag as potential merge
4. Include the flag in the AI context
5. AI decides whether to suggest a merge and returns a `MergeAction`

### 13.4 MergeAction

```typescript
type MergeAction = {
  type: "MERGE_INTO"
  sourceEntry: EntrySummary      // The new content
  targetEntry: { id: string; title: string; type: string }
  mergePreview: string           // "Adds 2 bullets and 3 skills to Poker AI"
}
```

### 13.5 UI

```
┌──────────────────────────────────────────────────────┐
│  I noticed this sounds related to your existing       │
│  "Poker AI" project.                                  │
│                                                        │
│  ◉ Create as a New Project (currently shown)          │
│  ○ Merge into "Poker AI" — adds 2 bullets, 3 skills  │
│                                                        │
│  [Save as New] [Merge into Poker AI]                  │
└──────────────────────────────────────────────────────┘
```

If user selects "Merge":
1. New bullets appended to existing entry
2. New tags/skills merged into existing
3. Source attribution preserved: "Bullets from: GitHub import (March 2026)"
4. Confirmation: "✓ Merged into Poker AI"

---

## 14. GitHub Import — Flagship Feature

### 14.1 Positioning

GitHub import is a flagship feature, not a utility. It deserves its own onboarding moment and a dedicated, rich interaction.

### 14.2 The "Drop Repository" Experience

```
User pastes a GitHub URL in chat
    ↓
Chat shows: "Importing repository..."
    ↓
AI: "I've analyzed your repository. Here's what I found:"
    ↓
┌────────────────────────────────────────────────────────────┐
│  Distributed Task Queue                                    │
│  github.com/username/distributed-task-queue                │
│                                                            │
│  Languages                                                 │
│  Go 72% · TypeScript 18% · Dockerfile 6% · Makefile 4%    │
│                                                            │
│  Frameworks                         │ System Confidence    │
│  • Gin (from go.mod)               │ ████████░░ 95%      │
│  • React (from package.json)       │ ████████░░ 95%      │
│  • Redis (from code analysis)      │ ██████░░░░ 61%      │
│                                                            │
│  Architecture                       │                      │
│  • Producer-Consumer pattern        │                      │
│  • REST API for job submission      │                      │
│  • Redis-backed priority queue      │                      │
│                                                            │
│  Dependencies                       │                      │
│  • gin-gonic/gin                    │                      │
│  • go-redis/redis                   │                      │
│  • google/uuid                      │                      │
│                                                            │
│  Recent Commits                     │                      │
│  • Add dead-letter queue handling   │                      │
│  • Optimize consumer pool size      │                      │
│  • Add Prometheus metrics           │                      │
│                                                            │
│  Topics: task-queue, distributed-systems, go, redis        │
│  License: MIT                                              │
│  Stars: 42 · Forks: 8                                     │
│                                                            │
│  [Import as Project]                                       │
└────────────────────────────────────────────────────────────┘
```

### 14.3 Deterministic Pipeline (No AI in Extraction)

1. GitHub API → README, languages, commit count, topics, package.json, go.mod, requirements.txt
2. Parse package.json → dependencies → framework detection (React, Express, etc.)
3. Parse go.mod → dependencies → framework detection (Gin, Echo, etc.)
4. Parse requirements.txt → Python deps → framework detection
5. Language breakdown from GitHub API
6. Topic detection from GitHub topics + deterministic keyword matching
7. Architecture detection from file structure (dir structure, config files)
8. Commit analysis: extract meaningful commit message patterns (last 10 commits)

**Only step 9 involves AI**: "Generate bullets from this enriched context."

### 14.4 System Confidence Labels

Each piece of extracted data has a confidence label:

| Data | Confidence Basis | Typical Range |
|---|---|---|
| Languages | GitHub API — exact | 99% |
| Frameworks (package.json) | Direct dependency parse | 95% |
| Frameworks (code analysis) | Import/require scanning | 80% |
| Frameworks (README heuristic) | Text pattern match | 61% |
| Topics | GitHub topics — exact | 99% |
| Architecture | File structure heuristics | 70% |

These confidences tell users what to verify. Low confidence = "double-check this."

### 14.5 Merge Suggestion After Import

After import, the AI checks existing memory:
- If similar project exists → merge suggestion card
- If no match → "Imported as new project"

---

## 15. System Confidence

### 15.1 What It Is

System Confidence measures **data provenance certainty**, not AI confidence. It tells users: "How sure are we that this information is correct?"

### 15.2 Where It Appears

| Context | Example |
|---|---|
| GitHub import | Framework detection: 95% (from package.json) vs 61% (from README) |
| PDF import | "Parsed from PDF: 92%" |
| AI extraction | "AI extracted from conversation: 88%" |
| Manual entry | "Entered by you: 99%" |

### 15.3 How It's Computed

Deterministically, based on the **source type** and **extraction method**:

| Source | Base Confidence | Modifiers |
|---|---|---|
| Manual (user typed) | 0.99 | None |
| GitHub API (languages) | 0.99 | None |
| GitHub API (deps) | 0.95 | Dep file type (package.json = 0.95, manual parse = 0.80) |
| PDF parse (field match) | 0.92 | Field detected in structured section |
| PDF parse (AI inferred) | 0.75 | Field inferred from unstructured text |
| AI from conversation | 0.88 | Single message |
| AI from conversation | 0.82 | Implicit (e.g., "I used React" = skill detection) |
| README heuristic | 0.61 | Pattern-matched, not confirmed |

### 15.4 Visualization

Confidence is shown as:
- A visual bar (green gradient for high, amber for medium, gray for low)
- A subtle number next to the bar (but only on hover — keeps the interface clean)
- Color thresholds: ≥0.90 = green, ≥0.70 = amber, <0.70 = gray

### 15.5 Not Shown

- Never shown for AI-generated bullet text (bullet text is either user-provided or AI-generated from user-provided data — it's always marked as "AI suggested")
- Never shown for Resume Fit (that score is computed differently — see Section 16)

---

## 16. Resume Fit Score

### 16.1 Concept

After a resume is compiled, show the user **why** the resume looks the way it does. The Resume Fit score explains what was matched and what's missing.

### 16.2 Deterministic Computation (No AI)

The score is computed entirely on the backend, using:
1. Parsed JD (structured JDAnalysis from Step 3)
2. Selected entries + their bullets (from the Resume Draft)
3. Skills database (all skills in Career Memory)

**Algorithm:**
```
required_skills = JD.requiredSkills
preferred_skills = JD.preferredSkills
matched_required = count(required_skills where skill exists in selected_entries OR skills_db)
matched_preferred = count(preferred_skills where skill exists in selected_entries OR skills_db)
score = (matched_required / len(required_skills) * 0.7 + matched_preferred / len(preferred_skills) * 0.3) * 100
```

### 16.3 UI

```
┌─────────────────────────────────────────────┐
│  Resume Fit: 85%                             │
│                                               │
│  Matched                                     │
│  ✓ Java (Experience: Coinbase, Uber)         │
│  ✓ PostgreSQL (Skill)                        │
│  ✓ Kafka (Project: Dist Task Queue)          │
│  ✓ AWS (Experience: Uber)                    │
│                                               │
│  Not Matched                                 │
│  ✗ Distributed Systems (Add to memory?)      │
│  ✗ Kubernetes (Add to memory?)               │
│                                               │
│  [Add Missing Skills to Memory]              │
└─────────────────────────────────────────────┘
```

### 16.4 "Add Missing Skills" Action

Clicking "Add..." triggers:
1. AI proposes adding the missing skill as a new Skill entry
2. Proposal card appears in chat
3. User confirms/edits/rejects
4. If confirmed, skill is added to Career Memory
5. Resume Fit updates in real-time

---

## Architecture Notes

### Raw Memory → Canonical Memory

The system stores two layers of memory:

```
Raw Memory (immutable storage)
├── GitHub README            (blob)
├── PDF upload text          (blob)
├── Conversation transcript  (text)
└── LinkedIn import          (blob)
        │
        ▼
Canonical Memory (structured)
├── Project
├── Experience
├── Education
├── Skill
├── Certificate
└── Achievement
```

**Raw Memory** is the immutable source — the original text from a GitHub README, the raw PDF text, the conversation transcript. It never changes and is never edited.

**Canonical Memory** is the structured, curated version — the fields extracted and organized by the AI. This is what the user edits and what resumes reference.

**Source attribution:** Every canonical entry links back to its raw memory source. This enables:
- Re-importing the same source later with a better parser
- Tracing AI decisions back to original data
- "Remove this import and all entries derived from it"
- Re-extracting with an updated knowledge base version

### Versioned Knowledge Base

```
knowledge/
├── v1/
│   └── resume/
│       ├── prompts/
│       ├── rules/
│       ├── examples/
│       └── quality/
├── v2/
│   └── resume/
│       └── ...
└── current -> v2
```

Each Resume Draft records which KB version was used (`kbVersion: "v1"`). This ensures:
- Recompiling a draft always uses the same rules
- Migrating to a new KB version doesn't break old drafts
- A/B testing prompts is possible (same draft, different KB → different output)
- The knowledge base is a version-controlled product, not a collection of scripts


*End of UX Specification — This document defines the interactive experience for every screen, state, and transition.*
