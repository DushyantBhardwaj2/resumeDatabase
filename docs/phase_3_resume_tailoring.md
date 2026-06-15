# Phase 3: Resume Tailoring & AI Generation

## 1. Objective
Build the AI engine and UI that accepts a Job Description (JD), matches it against the user's enriched profile data, and generates a tailored resume optimized for ATS (Applicant Tracking Systems) and human recruiters.

---

## 2. User Experience Flow
1. **Initiate Tailoring**:
   - The user clicks "Tailor Resume" from their dashboard.
2. **Input Job Details**:
   - The user inputs the Job Title, Company Name, and pastes the raw Job Description (JD) text into a text area.
3. **AI Generation Interface**:
   - The user submits the request. An elegant, animated loading state appears (e.g., "Analyzing JD...", "Tailoring skills...", "Optimizing descriptions...").
4. **Interactive Side-by-Side Preview**:
   - The screen splits into:
     - **Left**: Original profile data vs. Tailored modifications highlighted in a visual diff style.
     - **Right**: A premium PDF preview of the generated resume.
5. **Download**:
   - The user click "Download PDF" to export the generated resume.

---

## 3. Technical Requirements

### A. AI Prompt Orchestration (LLM Engine)
- **Model**: Google Gemini API (or other specified LLM).
- **Strategy**:
  1. **JD Analysis**: Extract keywords, core skills, responsibilities, and tone from the JD.
  2. **Experience Tailoring**: For each work experience and project bullet point, re-phrase or emphasize details relevant to the extracted JD keywords *without fabricating information*.
  3. **Skills Alignment**: Re-order or filter the skills section to match the top skills requested in the JD.
- **System Instructions**:
  - Critical constraint: Do *not* invent projects or work experience. Focus on highlighting and re-phrasing existing experiences.

### B. Resume Rendering & PDF Export
- **Rendering Libraries**:
  - Option A: Frontend HTML-to-PDF rendering using `html2canvas` + `jspdf` or `html2pdf.js`.
  - Option B: Server-side rendering using Puppeteer (headless browser) printing to PDF for perfect formatting.
- **Templates**: Standard professional black-and-white Single Column and Double Column layout templates designed to be ATS-friendly.

---

## 4. Key Endpoints & APIs
- `POST /api/resume/tailor`
  - **Payload**:
    ```json
    {
      "job_title": "Frontend Engineer",
      "company": "Google",
      "job_description": "We are looking for..."
    }
    ```
  - **Behavior**: Retrieves user profile, runs LLM orchestration, saves output version, and returns tailored JSON data.
- `POST /api/resume/export-pdf` - Receives tailored HTML/JSON and compiles it into a downloadable PDF binary.

---

## 5. Definition of Done
- [x] Users can submit a job title, company, and raw job description.
- [x] LLM successfully returns tailored bullet points and aligned skills based only on real profile data.
- [x] UI shows a split preview of the tailored changes.
- [x] The user can download the generated resume as a standard, ATS-friendly, correctly-formatted PDF.
