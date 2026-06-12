# Resumint — Master Feature Checklist

> **Purpose**: This is the single source of truth for every user-facing and system-level feature
> across all four development phases. The AI agent building this application MUST reference
> this document before, during, and after implementing each phase to ensure **no feature is
> left unbuilt**. Mark items `[x]` only when fully implemented and verified.

---

## Phase 1: Authentication & Cold Start (Resume Parsing)
*Reference: [phase_1_auth_and_parsing.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_1_auth_and_parsing.md)*

### 1.1 Landing Page
- [ ] **F1.1.1** — Hero / landing page with branding, tagline, and a prominent "Get Started" / "Login" CTA button
- [ ] **F1.1.2** — Responsive layout (mobile, tablet, desktop)
- [ ] **F1.1.3** — Premium visual design (gradients, animations, modern typography)

### 1.2 Authentication (Google OAuth)
- [ ] **F1.2.1** — "Sign in with Google" button initiating Google OAuth2 flow
- [ ] **F1.2.2** — Server-side domain validation: only `@nsut.ac.in` emails are allowed
- [ ] **F1.2.3** — Access-denied screen displayed for non-NSUT email addresses with a clear error message
- [ ] **F1.2.4** — On successful auth, create a new user record in the `users` table (if first login)
- [ ] **F1.2.5** — Session management via JWT or secure HTTP-only cookies
- [ ] **F1.2.6** — Logout functionality that destroys session/token
- [ ] **F1.2.7** — Redirect logic: first-time user → onboarding; returning user → dashboard

### 1.3 PDF Resume Upload & Parsing
- [ ] **F1.3.1** — File upload zone with drag-and-drop support
- [ ] **F1.3.2** — File type restriction: accept only `.pdf`
- [ ] **F1.3.3** — File size limit enforcement (max 5 MB) with user-friendly error
- [ ] **F1.3.4** — Backend raw text extraction from PDF bytes (e.g., `pdf-parse`)
- [ ] **F1.3.5** — Send extracted raw text to LLM (Gemini API) with a strict JSON schema prompt
- [ ] **F1.3.6** — LLM returns structured JSON: contact, education, experience, projects, skills
- [ ] **F1.3.7** — Server-side validation of the returned JSON (required keys present, correct types)
- [ ] **F1.3.8** — Animated loading/progress indicator during extraction & AI processing

### 1.4 Profile Preview & Initial Save
- [ ] **F1.4.1** — Display parsed data in an editable form grouped by section (Contact, Education, Experience, Projects, Skills)
- [ ] **F1.4.2** — User can edit, add, or remove items in each section before saving
- [ ] **F1.4.3** — "Save Profile" button persists the structured profile to the `profiles` table
- [ ] **F1.4.4** — Success toast notification on save; error toast on failure
- [ ] **F1.4.5** — Store raw resume text in the database for debugging/re-parsing

### 1.5 Database & API (Phase 1)
- [ ] **F1.5.1** — `users` table: id, email (unique), name, avatar_url, created_at
- [ ] **F1.5.2** — `profiles` table: id, user_id (FK), raw_resume_text, contact (JSONB), education (JSONB), experience (JSONB), projects (JSONB), skills (JSONB), updated_at
- [ ] **F1.5.3** — `GET /api/auth/login` — initiate OAuth
- [ ] **F1.5.4** — `GET /api/auth/callback` — handle OAuth callback, validate domain, issue session
- [ ] **F1.5.5** — `POST /api/resume/parse` — upload PDF, extract text, call AI, return JSON
- [ ] **F1.5.6** — `POST /api/profile/save` — persist profile JSON to database

---

## Phase 2: Profile Dashboard & Integration
*Reference: [phase_2_profile_dashboard.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_2_profile_dashboard.md)*

### 2.1 Dashboard Layout
- [ ] **F2.1.1** — Tabbed interface with sections: Personal Details, Education, Experience, Projects, Skills, Integrations
- [ ] **F2.1.2** — Profile completeness score displayed (e.g., "75% Complete") with a visual progress indicator
- [ ] **F2.1.3** — Responsive, premium card-based layout for each section
- [ ] **F2.1.4** — Navigation bar / sidebar with links to Dashboard, Tailor Resume, History (grayed out until Phase 3/4)

### 2.2 Profile Editing
- [ ] **F2.2.1** — Inline editing or modal forms for each profile section
- [ ] **F2.2.2** — Edit Contact Info: name, phone, email, LinkedIn URL, GitHub URL, portfolio URL
- [ ] **F2.2.3** — Edit Education: add/remove/reorder entries (school, degree, GPA, year range)
- [ ] **F2.2.4** — Edit Experience: add/remove/reorder entries (company, role, dates, bullet points)
- [ ] **F2.2.5** — Edit Projects: add/remove/reorder entries (title, tech stack, bullets, link)
- [ ] **F2.2.6** — Edit Skills: organized by category (languages, frameworks, tools, backend, coursework); add/remove items
- [ ] **F2.2.7** — Drag-and-drop reordering of items within Experience and Projects
- [ ] **F2.2.8** — Auto-save or explicit "Save Changes" with toast notification feedback

### 2.3 GitHub Integration
- [ ] **F2.3.1** — "Connect GitHub" button in the Integrations tab
- [ ] **F2.3.2** — Fetch public repositories via GitHub API using the provided username
- [ ] **F2.3.3** — Display list of repositories with name, description, primary language, and stars
- [ ] **F2.3.4** — User selects specific repos to import as profile Projects
- [ ] **F2.3.5** — Auto-populate project fields: title, tech stack, URL from repo metadata
- [ ] **F2.3.6** — AI-powered README summarization: generate 2–3 resume bullet points per selected repo
- [ ] **F2.3.7** — Store `github_username` in the profile; cache synced repo data in `github_repos` table
- [ ] **F2.3.8** — "Re-sync" button to refresh repo list and update imported project data

### 2.4 Database & API (Phase 2)
- [ ] **F2.4.1** — `github_repos` table: id, user_id, repo_name, repo_url, tech_stack, bullets_generated, synced_at
- [ ] **F2.4.2** — `GET /api/profile` — fetch saved profile
- [ ] **F2.4.3** — `PUT /api/profile` — update profile sections
- [ ] **F2.4.4** — `GET /api/integrations/github/repos?username=` — fetch public repos
- [ ] **F2.4.5** — `POST /api/profile/projects/github-import` — import selected repos into profile

---

## Phase 3: Resume Tailoring & AI Generation
*Reference: [phase_3_resume_tailoring.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_3_resume_tailoring.md)*

### 3.1 Tailoring Input Interface
- [ ] **F3.1.1** — "Tailor Resume" button accessible from the dashboard
- [ ] **F3.1.2** — Input form with fields: Job Title, Company Name, Job Description (textarea)
- [ ] **F3.1.3** — Input validation: all three fields required; JD must be ≥50 characters
- [ ] **F3.1.4** — "Generate" submit button

### 3.2 AI Tailoring Engine (Backend)
- [ ] **F3.2.1** — Retrieve user's complete profile data from the database
- [ ] **F3.2.2** — JD keyword extraction: identify core skills, responsibilities, and technical requirements
- [ ] **F3.2.3** — Experience tailoring: rephrase/emphasize existing bullet points to align with JD keywords
- [ ] **F3.2.4** — Project tailoring: highlight relevant tech stack and accomplishments matching the JD
- [ ] **F3.2.5** — Skills alignment: reorder and filter skills to prioritize JD-relevant skills
- [ ] **F3.2.6** — Anti-hallucination enforcement: LLM must not invent experiences or skills not in the profile
- [ ] **F3.2.7** — Use the LaTeX template ([resume_template.tex](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/resume_template.tex)) with `{{PLACEHOLDER}}` tokens as the output structure

### 3.3 Generation Loading UX
- [ ] **F3.3.1** — Multi-step animated loading state: "Analyzing JD…", "Tailoring skills…", "Optimizing descriptions…"
- [ ] **F3.3.2** — Graceful error handling: show a retry option if the AI call fails or times out

### 3.4 Resume Preview Interface
- [ ] **F3.4.1** — Side-by-side split view: original profile data (left) vs. tailored modifications (right)
- [ ] **F3.4.2** — Visual diff highlighting: show what was changed, added, or reordered
- [ ] **F3.4.3** — Live PDF preview panel rendering the tailored resume using the LaTeX template
- [ ] **F3.4.4** — User can manually edit tailored bullet points before finalizing

### 3.5 PDF Export & Download
- [ ] **F3.5.1** — "Download PDF" button that compiles the tailored data into a downloadable PDF
- [ ] **F3.5.2** — PDF rendering: server-side (Puppeteer) or client-side (html2pdf.js)
- [ ] **F3.5.3** — ATS-friendly formatting: standard fonts, no images in text, single/double column layout
- [ ] **F3.5.4** — Correct filename convention: `{FullName}_{Company}_{JobTitle}.pdf`

### 3.6 Database & API (Phase 3)
- [ ] **F3.6.1** — `POST /api/resume/tailor` — accept JD + job details, run LLM, return tailored JSON
- [ ] **F3.6.2** — `POST /api/resume/export-pdf` — compile tailored data into PDF binary for download
- [ ] **F3.6.3** — On successful tailoring, auto-save the result to the `tailored_resumes` history table

---

## Phase 4: History, Templates, & Polishing
*Reference: [phase_4_history_templates.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_4_history_templates.md)*

### 4.1 Resume History Dashboard
- [ ] **F4.1.1** — "My Resumes" page listing all previously generated resumes as cards
- [ ] **F4.1.2** — Each card displays: Job Title, Company Name, Date Generated, quick-download button
- [ ] **F4.1.3** — Click a card to open the full preview of that historical resume
- [ ] **F4.1.4** — Clone action: duplicate a historical resume as a starting point for a new tailoring
- [ ] **F4.1.5** — Edit action: re-open a historical resume for manual edits
- [ ] **F4.1.6** — Delete action: remove a resume from history with a confirmation dialog
- [ ] **F4.1.7** — Search/filter resumes by company name, job title, or date range

### 4.2 Template & Styling Customizer
- [ ] **F4.2.1** — Side panel or modal for template selection when previewing a resume
- [ ] **F4.2.2** — At least 3 template options: Minimalist, Classic, Tech-focused
- [ ] **F4.2.3** — Accent color picker (hex input or color wheel)
- [ ] **F4.2.4** — Font family selector (e.g., Inter, Playfair Display, Roboto, Palatino)
- [ ] **F4.2.5** — Font size adjustment (body text and heading sizes)
- [ ] **F4.2.6** — Section spacing / margin controls
- [ ] **F4.2.7** — Real-time preview update as style settings change
- [ ] **F4.2.8** — "Apply & Download" button to export the styled resume as PDF

### 4.3 UI/UX Polish
- [ ] **F4.3.1** — Smooth page transitions between all routes (fade, slide, or spring animations)
- [ ] **F4.3.2** — Hover effects on all interactive elements (buttons, cards, links)
- [ ] **F4.3.3** — Glassmorphism design elements (frosted glass panels, subtle blur backgrounds)
- [ ] **F4.3.4** — Dark mode / light mode toggle with persistent user preference
- [ ] **F4.3.5** — Micro-animations: loading spinners, skeleton screens, toast slide-ins
- [ ] **F4.3.6** — Cohesive design system: consistent color tokens, spacing scale, typography scale
- [ ] **F4.3.7** — Responsive design verified on mobile, tablet, and desktop breakpoints
- [ ] **F4.3.8** — Accessibility basics: keyboard navigation, focus outlines, ARIA labels

### 4.4 Database & API (Phase 4)
- [ ] **F4.4.1** — `tailored_resumes` table: id, user_id, company_name, job_title, job_description, tailored_data (JSONB), selected_template, style_config (JSONB), created_at
- [ ] **F4.4.2** — `GET /api/history` — list all tailored resumes for the user
- [ ] **F4.4.3** — `GET /api/history/{id}` — fetch a specific resume version
- [ ] **F4.4.4** — `DELETE /api/history/{id}` — delete a resume from history
- [ ] **F4.4.5** — `PUT /api/history/{id}/styling` — save updated style config for a resume

---

## Summary Counts

| Phase | Features |
|:------|:--------:|
| Phase 1: Auth & Parsing | 22 |
| Phase 2: Profile Dashboard | 21 |
| Phase 3: Resume Tailoring | 18 |
| Phase 4: History & Polish | 23 |
| **Total** | **84** |

---

> **Agent Instruction**: Before starting work on any phase, read this file and the corresponding
> phase document. After completing each feature, return here and mark it `[x]`. Do not consider
> a phase complete until every checkbox in that phase's section is checked.
