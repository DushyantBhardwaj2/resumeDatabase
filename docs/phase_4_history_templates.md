# Phase 4: History, Templates, & Polishing

## 1. Objective
Add advanced features such as historical tracking of tailored resumes, customizable templates, interactive styling configurations (margins, colors, fonts), and overall UI/UX polish to provide a premium feel.

---

## 2. User Experience Flow
1. **History Panel**:
   - The user visits a "My Resumes" dashboard showing cards for every resume generated.
   - Each card displays the Job Title, Company, Date, and a quick-download button.
   - Users can clone, edit, or delete historical resumes.
2. **Template & Styling Customizer**:
   - When previewing a resume, a side panel allows the user to:
     - Toggle between different templates (e.g., Minimalist, Classic, Tech-focused).
     - Customize theme color accent, font family (Inter, Playfair, Roboto), font size, and section spacing.
3. **Polished Experience**:
   - Smooth page transitions and hover states.
   - Premium loading animations and glassmorphism UI elements.

---

## 3. Technical Requirements

### A. Versioning and Database Schema Updates
- **Tailored Resumes History Table**:
  - `id` (PK)
  - `user_id` (FK to User)
  - `company_name`
  - `job_title`
  - `job_description`
  - `tailored_data` (JSON containing the generated resume content)
  - `selected_template`
  - `style_config` (JSON containing colors, margins, fonts)
  - `created_at`

### B. Styling Customizer Core
- Apply style configurations dynamically to the PDF rendering engine:
  - Font mappings: CSS variable values swapped based on user selection.
  - Spacing rules: Dynamic margins/padding classes applied to DOM elements prior to PDF compile.
  - ACCENT colors: Inject hex code into specific CSS classes.

---

## 4. Key Endpoints & APIs
- `GET /api/history` - Fetch all previously tailored resumes for the logged-in user.
- `GET /api/history/{id}` - Fetch a specific historical resume version.
- `DELETE /api/history/{id}` - Delete a resume from history.
- `PUT /api/history/{id}/styling` - Save updated styling configs for a specific resume history item.

---

## 5. Definition of Done
- [ ] Historical resume records are saved in the database after every tailoring event.
- [ ] Users can browse, preview, and download previously generated resumes from a history dashboard.
- [ ] The customizer panel successfully alters resume styling (typography, spacing, accents) in real time.
- [ ] Headless PDF exports reflect custom styles correctly.
- [ ] Interface includes transitions, hover animations, and a cohesive dark/light design system.
