# Resumint — Master Feature Checklist

> **Purpose**: This is the single source of truth for every user-facing and system-level feature
> across all four development phases. The AI agent building this application MUST reference
> this document before, during, and after implementing each phase to ensure **no feature is
> left unbuilt**. Mark items `[x]` only when fully implemented and verified.

---

## Phase 1: Authentication & Cold Start (Resume Parsing)
*Reference: [phase_1_auth_and_parsing.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_1_auth_and_parsing.md)*

### 1.1 Landing Page
- [x] **F1.1.1** — Hero / landing page with branding, tagline, and a prominent "Get Started" / "Login" CTA button
- [x] **F1.1.2** — Responsive layout (mobile, tablet, desktop)
- [x] **F1.1.3** — Premium visual design (gradients, animations, modern typography)

### 1.2 Authentication (Google OAuth)
- [x] **F1.2.1** — "Sign in with Google" button initiating Google OAuth2 flow
- [x] **F1.2.2** — Server-side domain validation: only `@nsut.ac.in` emails are allowed (via Better Auth `databaseHooks`)
- [x] **F1.2.3** — Access-denied screen displayed for non-NSUT email addresses (shows `?error=unable_to_create_user`)
- [x] **F1.2.4** — On successful auth, create a new user record in the `users` table (if first login)
- [x] **F1.2.5** — Session management via Better Auth (cookie-based)
- [x] **F1.2.6** — Logout functionality that destroys session/token (Better Auth handled)
- [x] **F1.2.7** — Redirect logic: first-time user → onboarding; returning user → dashboard

### 1.3 PDF Resume Upload & Parsing
- [x] **F1.3.1** — File upload zone with drag-and-drop support
- [x] **F1.3.2** — File type restriction: accept only `.pdf`
- [x] **F1.3.3** — File size limit enforcement (max 5 MB) with user-friendly error
- [x] **F1.3.4** — Backend raw text extraction from PDF bytes (`pdf-parse` v2)
- [x] **F1.3.5** — Send extracted raw text to LLM (OpenCode Zen / `deepseek-v4-flash-free`) with a strict JSON schema prompt
- [x] **F1.3.6** — LLM returns structured JSON: contact, education, experience, projects, skills
- [x] **F1.3.7** — Server-side validation of the returned JSON (Zod schema — required keys present, correct types)
- [x] **F1.3.8** — Animated loading/progress indicator during extraction & AI processing

### 1.4 Profile Preview & Initial Save
- [x] **F1.4.1** — Display parsed data in an editable form grouped by section (Contact, Education, Experience, Projects, Skills)
- [x] **F1.4.2** — User can edit, add, or remove items in each section before saving
- [x] **F1.4.3** — "Save Profile" button persists the structured profile to the `profiles` table (upsert)
- [x] **F1.4.4** — Success toast notification on save; error toast on failure (sonner)
- [x] **F1.4.5** — Store raw resume text in the database for debugging/re-parsing

### 1.5 Database & API (Phase 1)
- [x] **F1.5.1** — `users` table: id, email (unique), name, avatar_url, created_at (via Better Auth + schema)
- [x] **F1.5.2** — `profiles` table: id, user_id (FK), raw_resume_text, contact (JSONB), education (JSONB), experience (JSONB), projects (JSONB), skills (JSONB), updated_at
- [x] **F1.5.3** — `* /api/auth/[...all]` — Better Auth handler (covers login, callback, session, logout)
- [x] **F1.5.4** — OAuth callback handled via Better Auth at `/api/auth/callback/google`
- [x] **F1.5.5** — `POST /api/protected/resume/parse` — upload PDF, extract text, call AI, return JSON
- [x] **F1.5.6** — `POST /api/protected/profile` — persist profile JSON to database

---

## Phase 2: Profile Dashboard & Integration
*Reference: [phase_2_profile_dashboard.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_2_profile_dashboard.md)*

### 2.1 Dashboard Layout
- [x] **F2.1.1** — Tabbed interface with sections: Contact, Education, Experience, Projects, Skills, Integrations
- [x] **F2.1.2** — Profile completeness score displayed with a visual progress indicator
- [x] **F2.1.3** — Responsive, premium card-based layout for each section
- [x] **F2.1.4** — Navigation sidebar with links to Dashboard, My Profile, Tailor Resume (disabled), History (disabled)

### 2.2 Profile Editing
- [x] **F2.2.1** — Inline editing for each profile section
- [x] **F2.2.2** — Edit Contact Info: phone, LinkedIn URL, GitHub URL, portfolio URL
- [x] **F2.2.3** — Edit Education: add/remove entries (school, degree, GPA, year range)
- [x] **F2.2.4** — Edit Experience: add/remove/reorder entries (company, role, dates, bullet points)
- [x] **F2.2.5** — Edit Projects: add/remove/reorder entries (title, tech stack, bullets, link)
- [x] **F2.2.6** — Edit Skills: organized by category (languages, frameworks, tools); add/remove items
- [x] **F2.2.7** — Drag-and-drop reordering of items within Experience and Projects
- [x] **F2.2.8** — "Save Changes" button with toast notification feedback

### 2.3 GitHub Integration
- [x] **F2.3.1** — "Connect GitHub" button in the Integrations tab
- [x] **F2.3.2** — Fetch public repositories via GitHub API using the provided username
- [x] **F2.3.3** — Display repositories with name, description, primary language, and stars
- [x] **F2.3.4** — User selects specific repos to import as profile Projects
- [x] **F2.3.5** — Auto-populate project fields: title, tech stack, URL from repo metadata
- [x] **F2.3.6** — AI-powered README summarization: generate 2–3 resume bullet points per selected repo
- [x] **F2.3.7** — Store `github_username` in the profile; cache synced repo data in `github_repos` table
- [x] **F2.3.8** — "Re-sync" button to refresh repo list and update imported project data

### 2.4 Database & API (Phase 2)
- [x] **F2.4.1** — `github_repos` table already in schema (id, user_id, repo_name, repo_url, tech_stack, bullets_generated, synced_at)
- [x] **F2.4.2** — `GET /api/profile` — fetch saved profile
- [x] **F2.4.3** — `PUT /api/profile` — update profile sections
- [x] **F2.4.4** — `GET /api/integrations/github/repos?username=` — fetch public repos
- [x] **F2.4.5** — `POST /api/profile/projects/github-import` — import selected repos into profile

---

## Phase 3: Resume Tailoring & AI Generation
*Reference: [phase_3_resume_tailoring.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_3_resume_tailoring.md)*

### 3.1 Tailoring Input Interface
- [x] **F3.1.1** — "Tailor Resume" nav link enabled in sidebar (removed `disabled: true`)
- [x] **F3.1.2** — Input form with fields: Job Title, Company Name, Job Description (textarea)
- [x] **F3.1.3** — Input validation: all three fields required; JD must be ≥50 characters
- [x] **F3.1.4** — "Generate Tailored Resume" submit button

### 3.2 AI Tailoring Engine (Backend)
- [x] **F3.2.1** — Retrieves user's complete profile from database
- [x] **F3.2.2** — JD keyword extraction: AI identifies core skills, responsibilities, technical requirements
- [x] **F3.2.3** — Experience tailoring: bullet points rephrased/emphasized to align with JD keywords
- [x] **F3.2.4** — Project tailoring: tech stack and accomplishments highlighted to match JD
- [x] **F3.2.5** — Skills alignment: skills reordered and filtered to prioritize JD-relevant ones
- [x] **F3.2.6** — Anti-hallucination enforcement via strict prompt rules (no invented data)
- [x] **F3.2.7** — Output structured in JSON with experience, projects, skills matching profile structure

### 3.3 Generation Loading UX
- [x] **F3.3.1** — Multi-step animated loading: "Analyzing job description...", "Tailoring your experience...", "Optimizing descriptions..." with bouncing dots
- [x] **F3.3.2** — Graceful error handling with toast message; user can retry by clicking "Generate" again

### 3.4 Resume Preview Interface
- [x] **F3.4.1** — Side-by-side split view: original profile (left) vs. tailored modifications (right)
- [x] **F3.4.2** — Visual diff highlighting: left blue border on tailored sections that differ from original
- [x] **F3.4.3** — Print-preview panel renders the tailored resume with ATS-friendly formatting
- [x] **F3.4.4** — User can edit tailored bullet points via inline textarea editor (click "Edit" on any section)

### 3.5 PDF Export & Download
- [x] **F3.5.1** — "Download PDF" button triggers print dialog with styled resume content
- [x] **F3.5.2** — Server-side PDF via LaTeX compilation (`pdflatex` + `docs/resume_template.tex`)
- [x] **F3.5.3** — ATS-friendly formatting via LaTeX template: Times Roman, standard margins, clean typography
- [x] **F3.5.4** — Filename via document title: `{JobTitle}_{Company}_resume.pdf`

### 3.6 Database & API (Phase 3)
- [x] **F3.6.1** — `POST /api/resume/tailor` — accepts JD + job details, runs LLM, returns tailored JSON
- [x] **F3.6.2** — PDF export via client-side `window.print()` with dedicated print CSS
- [x] **F3.6.3** — Auto-saves result to `tailored_resumes` table on successful generation

---

## Phase 4: History, Templates, & Polishing
*Reference: [phase_4_history_templates.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_4_history_templates.md)*

### 4.1 Resume History Dashboard
- [x] **F4.1.1** — "My Resumes" page listing all previously generated resumes as cards
- [x] **F4.1.2** — Each card displays: Job Title, Company Name, Date Generated, quick-download button
- [x] **F4.1.3** — Click a card to open the full preview of that historical resume
- [x] **F4.1.4** — Clone action: duplicate a historical resume as a starting point for a new tailoring
- [x] **F4.1.5** — Edit action: re-open a historical resume for manual edits
- [x] **F4.1.6** — Delete action: remove a resume from history with a confirmation dialog
- [x] **F4.1.7** — Search/filter resumes by company name, job title, or date range

### 4.2 Template & Styling Customizer
- [x] **F4.2.1** — Side panel or modal for template selection when previewing a resume
- [x] **F4.2.2** — At least 3 template options: Minimalist, Classic, Tech-focused
- [x] **F4.2.3** — Accent color picker (hex input or color wheel)
- [x] **F4.2.4** — Font family selector (e.g., Inter, Playfair Display, Roboto, Palatino)
- [x] **F4.2.5** — Font size adjustment (body text and heading sizes)
- [x] **F4.2.6** — Section spacing / margin controls
- [x] **F4.2.7** — Real-time preview update as style settings change
- [x] **F4.2.8** — "Apply & Download" button to export the styled resume as PDF

### 4.3 UI/UX Polish
- [x] **F4.3.1** — Smooth page transitions between all routes (fade, slide, or spring animations)
- [x] **F4.3.2** — Hover effects on all interactive elements (buttons, cards, links)
- [x] **F4.3.3** — Glassmorphism design elements (frosted glass panels, subtle blur backgrounds)
- [x] **F4.3.4** — Dark mode / light mode toggle with persistent user preference
- [x] **F4.3.5** — Micro-animations: loading spinners, skeleton screens, toast slide-ins
- [x] **F4.3.6** — Cohesive design system: consistent color tokens, spacing scale, typography scale
- [x] **F4.3.7** — Responsive design verified on mobile, tablet, and desktop breakpoints
- [x] **F4.3.8** — Accessibility basics: keyboard navigation, focus outlines, ARIA labels

### 4.4 Database & API (Phase 4)
- [x] **F4.4.1** — `tailored_resumes` table: id, user_id, company_name, job_title, job_description, tailored_data (JSONB), selected_template, style_config (JSONB), created_at
- [x] **F4.4.2** — `GET /api/history` — list all tailored resumes for the user
- [x] **F4.4.3** — `GET /api/history/{id}` — fetch a specific resume version
- [x] **F4.4.4** — `DELETE /api/history/{id}` — delete a resume from history
- [x] **F4.4.5** — `PUT /api/history/{id}/styling` — save updated style config for a resume

---

## Phase 5: Design System & AI-Assisted Content Creation
*Reference: [ui_design.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/ui_design.md), [data_saving_planning.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/data_saving_planning.md)*

### 5.1 Design System Foundation (Step 1) ✅
- [x] **F5.1.1** — Tailwind v4 CSS variables with expanded color palette (primary-light, accent-dark/light, warning)
- [x] **F5.1.2** — Satoshi font for headings (via Fontshare CDN)
- [x] **F5.1.3** — Inter font for body text (via `next/font/google`)
- [x] **F5.1.4** — JetBrains Mono for code/monospace (via fontsource)
- [x] **F5.1.5** — Base `Button` component: 4 variants (primary/secondary/ghost/danger), 3 sizes, loading state
- [x] **F5.1.6** — Base `Input` component: with label/error/hint support; `Textarea` variant
- [x] **F5.1.7** — Base `Badge` component: 6 color variants, 2 sizes
- [x] **F5.1.8** — Base `Card` component: 3 variants (default/glass/interactive), 4 padding options
- [x] **F5.1.9** — Design system documented in `docs/ui_design.md`
- [x] **F5.1.10** — Data saving philosophy documented in `docs/data_saving_planning.md`
- [x] **F5.1.11** — Shared `Field` component extracted (supports vertical + horizontal layout)
- [x] **F5.1.12** — Shared `SectionCard` component extracted (sm/md spacing variants)
- [x] **F5.1.13** — Shared `BulletList` component extracted (add/remove/edit bullets)
- [x] **F5.1.14** — Onboarding + profile pages refactored to use shared components

### 5.2 Universal AI-Assisted Content Component (Step 2) ✅
- [x] **F5.2.1** — AI bullet generation API endpoint `POST /api/ai/generate-bullets`
- [x] **F5.2.2** — `AIAssistedContent` component with 3 modes (AI generation, manual, hybrid)
- [x] **F5.2.3** — Raw text input area for user descriptions
- [x] **F5.2.4** — "Generate with AI" button with loading state
- [x] **F5.2.5** — Checkbox-based selection UI for AI-generated suggestions
- [x] **F5.2.6** — "Accept Selected" + "Reject & try again" actions
- [x] **F5.2.7** — Manual bullet input mode (no AI)
- [x] **F5.2.8** — Hybrid edit mode (pre-populated items + AI refine option)
- [x] **F5.2.9** — Works across experience, projects, skills, and summary sections
- [x] **F5.2.10** — Covered by existing `PUT /api/profile` (no separate endpoint needed)

### 5.3 Onboarding Multi-Step Wizard (Step 3) ✅
- [x] **F5.3.1** — Multi-step wizard layout with step indicator / progress bar
- [x] **F5.3.2** — Step 1: PDF upload & parse (existing flow, refactored into wizard)
- [x] **F5.3.3** — Step 2: Add experience entries via AI-assisted component
- [x] **F5.3.4** — Step 3: Add skills via AI-assisted component
- [x] **F5.3.5** — Step 4: Projects with AI-assisted component
- [x] **F5.3.6** — Step 5: Review all sections & save to database
- [x] **F5.3.7** — Each step has "Skip" option (no data required)
- [x] **F5.3.8** — Back/Next navigation between steps
- [ ] **F5.3.9** — Progress persisted in case of browser refresh (future enhancement)

### 5.4 Profile Dashboard AI Integration (Step 4) ✅
- [x] **F5.4.1** — AI-assisted content creation integrated into Experience editor
- [x] **F5.4.2** — AI-assisted content creation integrated into Projects editor
- [x] **F5.4.3** — AI-assisted content creation integrated into Skills editor
- [x] **F5.4.4** — Reusable `AIAssistedContent` component shared across all sections
- [x] **F5.4.5** — Ability to re-generate AI suggestions for existing items

---

## Summary Counts

| Phase | Features | Completed |
|:------|:--------:|:---------:|
| Phase 1: Auth & Parsing | 22 | 22/22 |
| Phase 2: Profile Dashboard | 21 | 21/21 |
| Phase 3: Resume Tailoring | 18 | 18/18 |
| Phase 4: History & Polish | 23 | 23/23 |
| Phase 5: Design System & AI Content | 38 | 37/38 |
| **Total** | **122** | **121/122** |

---

> **Agent Instruction**: Before starting work on any phase, read this file and the corresponding
> phase document. After completing each feature, return here and mark it `[x]`. Do not consider
> a phase complete until every checkbox in that phase's section is checked.
