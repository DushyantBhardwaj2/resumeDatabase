# Phase 2: Profile Dashboard & Integration

## 1. Objective
Build the main dashboard where users can manage, edit, and expand their stored profile. The key highlight of this phase is integrating GitHub to import/sync project details and code statistics.

---

## 2. User Experience Flow
1. **Dashboard Overview**:
   - Once logged in, the user sees their profile completeness score (e.g., "75% Complete").
   - A clean tabbed interface displays: Personal Details, Education, Experience, Projects, Skills, and Integrations.
2. **GitHub Integration Hub**:
   - The user navigates to the "Integrations" tab and connects their GitHub account.
   - The dashboard retrieves their public repositories.
   - The user selects which repositories they want to add as "Projects" in their profile.
   - The system auto-fills fields like tech stack, project title, and link, and pulls README data to suggest description bullet points.
3. **Manual Editing**:
   - Intuitive inline editing or form modals for each section.
   - Drag-and-drop ordering of projects and experience items.

---

## 3. Technical Requirements

### A. UI Design & Layout
- A premium, responsive layout.
- Interactive cards for each section.
- Toast notifications for success/error responses when saving.

### B. GitHub Integration Logic
- **API Fetching**: Query the GitHub API (`https://api.github.com/users/{username}/repos`) to list public repositories.
- **Repository Metadata Sync**:
  - Parse name, description, primary language (tech stack), and stars.
  - Optional: Parse repository READMEs using the GitHub API to summarize project scope using AI.
- **Database Schema Updates**:
  - Add `github_username` and `github_token` (securely encrypted if OAuth is used) to the `User` or `Profile` table.
  - Add `github_repo_url` and `github_sync` status flag to the project schema.

---

## 4. Key Endpoints & APIs
- `GET /api/profile` - Fetch the user's saved profile data.
- `PUT /api/profile` - Update profile details (education, experience, skills).
- `GET /api/integrations/github/repos?username={username}` - Retrieve a list of public repositories for a username.
- `POST /api/profile/projects/github-import` - Import selected repos into the profile projects database.

---

## 5. Definition of Done
- [x] Users can edit all sections of their profile (Education, Experience, Skills, Projects) and persist edits to the database.
- [x] GitHub repository fetch lists active public repositories correctly.
- [x] Users can select specific repositories to import.
- [x] Imported repositories populate the profile's project list with title, description, link, and tech stack details.
- [x] Dashboard displays profile completion status to guide user data entry.
