# Product Documentation: Resumint

This document details the functionality, user flows, and development phases for Resumint.

## 1. Product Overview & Vision
Resumint is a resume tailoring and optimization platform designed for students and job seekers (starting with the NSUT community). It allows users to build comprehensive profiles and instantly generate custom, job-tailored resumes matching specific Job Descriptions (JDs) using AI, eliminating the "cold start" effort of manual tailoring.

## 2. Core User Workflows

### A. First-Time User (Cold Start Flow)
1. **Landing & Authentication**:
   - The user lands on the website.
   - They log in using their NSUT institutional email domain: `@nsut.ac.in`.
2. **Old Resume Import**:
   - The user uploads their existing resume in PDF format.
   - The system extracts and structures profile information (education, skills, work experience, projects, etc.) from the PDF.
3. **Profile Enrichment**:
   - The user reviews the extracted data and has the option to edit or add additional information.
4. **Data Persistence**:
   - The structured profile data is stored in the database.
5. **Tailored Generation**:
   - The user provides a Job Description (JD).
   - The system sends the user's stored profile, old resume context, and the new JD to the AI model.
   - The system generates a custom, tailored resume.

### B. Repetitive User Flow
1. **Profile Management & Enrichment**:
   - The user maintains a rich profile containing:
     - GitHub repositories/links.
     - Project descriptions and tech stack details.
     - Work experience, skills, and certifications.
2. **Instant Tailoring**:
   - The user inputs a new Job Description (JD).
   - The system retrieves the user's complete, up-to-date profile data.
   - It formats and submits this data along with the new JD to the AI model.
   - The AI generates a customized resume optimized for the new JD.

## 3. Data Architecture & Lifecycle
For detailed specifications on data flows, database entity relationships, schema layouts, and prompt engineering schemas for LLM ingestion, refer to:
*Detailed Specification: [user_data_lifecycle.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/user_data_lifecycle.md)*

## 4. Proposed Development Phases

### Phase 1: Authentication & Cold Start (Resume Parsing)
*Detailed Doc: [phase_1_auth_and_parsing.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_1_auth_and_parsing.md)*
- Institutional Google OAuth authentication restricted to `@nsut.ac.in`.
- PDF upload interface.
- Backend pipeline to extract and structure text from the uploaded PDF.
- Database schema and storage for structured user profiles.

### Phase 2: Profile Dashboard & Integration
*Detailed Doc: [phase_2_profile_dashboard.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_2_profile_dashboard.md)*
- User interface to view, edit, and enrich the user profile.
- GitHub integration (allowing users to sync or link repositories and projects).
- Management of skills, education, and experience.

### Phase 3: Resume Tailoring & AI Generation
*Detailed Doc: [phase_3_resume_tailoring.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_3_resume_tailoring.md)*
- Input interface for Job Descriptions.
- AI prompt orchestration combining profile data + JD.
- Generation of the tailored resume and rendering/downloading options.

### Phase 4: History, Templates, & Polishing
*Detailed Doc: [phase_4_history_templates.md](file:///c:/Users/Dushy/OneDrive/Desktop/Projects/resumemint/docs/phase_4_history_templates.md)*
- History dashboard showing previously tailored resumes.
- Theme/template selection for the generated resumes.
- User experience adjustments, micro-animations, and performance tuning.


