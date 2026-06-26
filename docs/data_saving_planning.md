# Data Saving Philosophy & Universal AI-Assisted Content Creation

> **Version**: 1.0
> **Status**: Active — governs all new data creation flows

---

## 1. Three-Phase Project Overview

The Resumint data management architecture is divided into three distinct phases:

### Phase 1: Onboarding (Cold Start)
**Goal**: Get a new user from zero to a structured profile in the database.

**Flow**:
1. User uploads a PDF resume or enters raw text
2. AI parses the raw text into structured JSON (contact, education, experience, projects, skills)
3. User reviews/edits the parsed data in a multi-step wizard
4. User saves → `Profile` table upserted

**Key principle**: The AI does a "first pass" bulk extraction, but the user always has final approval before anything touches the database.

### Phase 2: Profile Dashboard (Continuous Enrichment)
**Goal**: Allow users to add/edit individual sections of their profile at any time.

**Flow**:
1. User navigates to a section (e.g. Experience, Projects, Skills)
2. User can:
   - **Paste raw text** describing their work → AI standardizes into bullet points → user selects which bullets to save
   - **Link a GitHub repo** → AI reads README → generates bullet points → user selects which to save
   - **Manually type** items directly
3. Only the user-selected items are persisted to the database

### Phase 3: Resume Tailoring (Retrieval + Generation)
**Goal**: Generate ATS-optimized tailored resumes from the stored profile.

**Flow**:
1. User provides a Job Description
2. System retrieves the full `Profile` from DB
3. AI tailors the profile content to match the JD (rewriting bullets, reordering skills)
4. Generated result is saved as an immutable snapshot in `TailoredResume`
5. User can download as PDF (via LaTeX compilation)

---

## 2. Universal AI-Assisted Data Standardization Rule

**This rule applies to ALL data creation flows across Phases 1 and 2.**

### The Rule

> **Any raw user input (free text, GitHub links, PDF text) MUST be passed through the AI layer to produce standardized, ATS-friendly structured data. The user MUST then be shown a selection UI (checkboxes) to choose which generated items to keep. ONLY the user-selected items are saved to the database.**

### Why This Rule Exists

1. **ATS compatibility**: AI-standardized bullet points follow STAR/action-oriented format, making them machine-parseable by ATS systems
2. **User control**: The user retains veto power over what goes into their profile
3. **Quality guardrail**: Raw text often contains irrelevant details, typos, or non-resume-appropriate content — the AI filters and structures
4. **Consistency**: Every piece of data in the system follows the same schema and quality standard

### When the Rule Applies

| Flow | Input | AI Action | User Action | DB Save |
|------|-------|-----------|-------------|---------|
| PDF Upload (Onboarding) | PDF file | Extract + structure all sections | Edit/review parsed data | Full profile upsert |
| Add Experience (Profile) | Free-text description of role | Generate bullet points | Check which bullets to keep | Selected bullets only |
| Add Project (Profile) | Free-text description or GitHub URL | Generate bullet points | Check which bullets to keep | Selected bullets only |
| GitHub Import (Profile) | GitHub repo URL + README | Generate project bullet points | Select repos + check bullets | Selected repos + bullets |
| Add Skills (Profile) | Free-text skill names | Categorize into languages/frameworks/tools | Select which skills to keep | Selected skills only |

---

## 3. Reusable Content Creation Workflow (Universal Component)

A single, reusable client component is used across all data creation flows. It has three modes of operation:

### Mode A: AI-Assisted Generation

```
┌─────────────────────────────────────────────────┐
│  "Describe your [experience/project/skills]"    │
│  ┌─────────────────────────────────────────────┐│
│  │ Paste a description, link a GitHub repo,    ││
│  │ or type your raw text here...               ││
│  └─────────────────────────────────────────────┘│
│  [Generate with AI]                             │
│                                                 │
│  ── AI-Generated Suggestions ──                 │
│  ☑ Led a team of 5 engineers to deliver...      │
│  ☐ Built REST API serving 10K requests/day...   │
│  ☐ Optimized DB queries reducing latency...     │
│  [Save Selected (n)]  [Discard]                 │
└─────────────────────────────────────────────────┘
```

**Flow**:
1. User types/pastes raw content (or provides a GitHub URL)
2. User clicks "Generate with AI"
3. Loading state appears while AI processes
4. Checkbox list of generated bullet points appears
5. User checks desired items
6. User clicks "Save Selected"
7. Only checked items are sent to the API and persisted

### Mode B: Manual Input

```
┌─────────────────────────────────────────────────┐
│  Add items manually:                           │
│  [Bullet point 1...]  ✕                         │
│  [Bullet point 2...]  ✕                         │
│  [+ Add bullet]                                 │
│  [Save]                                         │
└─────────────────────────────────────────────────┘
```

User types items directly (no AI involved). Used when the user wants to write original content.

### Mode C: Hybrid (Pre-populated + AI Refine)

Used when editing existing data (e.g. editing a saved experience entry). Shows current bullets as pre-checked items, plus an option to "Improve with AI" which generates alternative phrasings.

### Component Props Interface

```typescript
interface AIAssistedContentProps {
  /** The section type determines the AI prompt and output schema */
  section: "experience" | "project" | "skills" | "education"
  /** Called with the final array of selected items to save */
  onSave: (selected: string[]) => Promise<void>
  /** If editing existing data, pre-populate these items (pre-checked) */
  existingItems?: string[]
  /** Optional context (e.g. company name for experience, tech stack for projects) */
  context?: Record<string, string>
  /** Placeholder text for the input area */
  placeholder?: string
  /** Callback when the user discards/closes */
  onCancel?: () => void
}
```

### API Contract

**`POST /api/ai/generate-bullets`**

```json
{
  "section": "experience",
  "rawInput": "I worked as a software engineer at Google where I built features for Search...",
  "context": {
    "company": "Google",
    "role": "Software Engineer",
    "techStack": "TypeScript, React, Go"
  }
}
```

Response:
```json
{
  "suggestions": [
    "Developed and shipped new Search features using TypeScript and Go, serving 100M+ users",
    "Collaborated with cross-functional teams to design and implement scalable microservices architecture",
    "Reduced page load latency by 40% through optimized React component rendering and caching strategies"
  ]
}
```

> **Note**: `POST /api/profile/save-bullets` was planned but NOT implemented. `PUT /api/profile` already supports partial section updates — the client merges accepted bullets into local state and calls `PUT /api/profile` to persist.
```

---

## 4. Data Flow Diagram

```
                           ┌─────────────────────┐
                           │   Raw User Input     │
                           │ (text / PDF / URL)   │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │  AI Processing       │
                           │  (standardize +      │
                           │   structure)         │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │  Selection UI        │
                           │  (checkboxes)        │
                           └──────────┬──────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                          ▼                       ▼
                   ┌──────────────┐     ┌──────────────────┐
                   │ Save Selected │     │    Discard       │
                   │ → Database   │     │ (no persistence) │
                   └──────────────┘     └──────────────────┘
```

---

## 5. Component File Structure

```
src/
  components/
    ai-assisted-content.tsx    ← Universal AI component (Modes A/B/C)
    ui/
      button.tsx               ← Base Button
      input.tsx                ← Base Input
      badge.tsx                ← Base Badge
      card.tsx                 ← Base Card
```

---

## 6. Validation Rules

- AI-generated bullet points: max 200 chars per bullet, 3–5 bullets per section
- Manual input: max 500 chars per bullet, unlimited bullets per section
- Skills: max 50 chars per skill, max 30 skills per category
- Education: required fields `school`, `degree`; optional `gpa`, `startYear`, `endYear`
- GitHub import: only public repos; README summarization limited to 3 bullets per repo
