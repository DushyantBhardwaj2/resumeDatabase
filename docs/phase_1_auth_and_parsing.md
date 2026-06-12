# Phase 1: Authentication & Cold Start (Resume Parsing)

## 1. Objective
Build the entry point of the Resumint application, allowing users to securely authenticate using their institutional email domain (`@nsut.ac.in`) and initialize their profiles by uploading and parsing an existing PDF resume.

---

## 2. User Experience Flow
1. **Landing & Call to Action**:
   - The user visits the homepage.
   - An elegant login/get started button prompts the user to authenticate.
2. **Institutional Log In**:
   - The user logs in via Google OAuth.
   - The system validates that the email address belongs to the `@nsut.ac.in` domain.
   - If not authorized, display an access-denied screen. If authorized, redirect to the onboarding screen.
3. **First-Time Setup (PDF Resume Upload)**:
   - The user is presented with a file upload zone supporting drag-and-drop for PDF files.
   - A loading state appears showing that the system is extracting their information.
4. **Initial Profile Form (Extracted Data Preview)**:
   - The system displays the extracted data categorized into sections (Name, Contact, Education, Experience, Projects, Skills).
   - The user reviews, updates, or adds details, then saves to complete the onboarding.

---

## 3. Technical Requirements

### A. Authentication
- **OAuth Provider**: Google OAuth2.
- **Domain Restriction Logic**:
  ```javascript
  if (!email.endsWith('@nsut.ac.in')) {
      return error("Access restricted to NSUT students/staff.");
  }
  ```
- **Session Management**: JWT or cookie-based sessions.

### B. PDF Parsing & Extraction Pipeline
1. **File Upload Handling**: Accept only `.pdf` files, limit file size (e.g., 5MB).
2. **Text Extraction**: Parse text content from raw PDF bytes (e.g., using `pdf-parse` in Node.js or `PyPDF2` in Python).
3. **AI Structure Generation**:
   - Send the extracted raw text to an AI model (e.g., Gemini API) with a structured system instruction.
   - Request the response in a structured JSON format matching the database schema.
   - *Example System Prompt*:
     > "You are an expert resume parsing AI. Extract the contact info, education history, work experience, projects, and skills from the following resume text and format it exactly into this JSON schema..."

### C. Database Schema (Initial)
- **User Table**:
  - `id` (PK)
  - `email` (unique)
  - `name`
  - `created_at`
  - `updated_at`
- **Profile Table**:
  - `id` (PK)
  - `user_id` (FK to User)
  - `raw_resume_text` (optional, for debugging)
  - `contact_info` (JSON: phone, github_link, linkedin_link, website)
  - `education` (JSON array: institution, degree, major, start_year, end_year, gpa)
  - `experience` (JSON array: company, role, location, start_date, end_date, description_bullets)
  - `projects` (JSON array: title, tech_stack, description_bullets, link)
  - `skills` (JSON array: category, list_of_skills)

---

## 4. Key Endpoints & APIs
- `GET /api/auth/login` - Initiate Google OAuth.
- `GET /api/auth/callback` - Receive OAuth token, validate domain, create session.
- `POST /api/resume/parse` - Accepts PDF file upload, extracts text, calls AI parser, and returns structured JSON.
- `POST /api/profile/save` - Accepts structured JSON, saves to Profile table.

---

## 5. Definition of Done
- [ ] Users cannot authenticate with non-@nsut.ac.in emails.
- [ ] Successful Google login creates a user account in the database.
- [ ] PDF upload extracts text and calls the AI model successfully.
- [ ] Structured JSON is generated and displayed back to the user in a form.
- [ ] Saving the form inserts the profile details into the database.
