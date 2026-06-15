# ResumeMint On-Campus Resume & Profile Requirements

This document outlines all the data fields, validation rules, and structural sections required to generate a high-quality, college-compliant (e.g., NSUT standard) **On-Campus Resume**. It serves as a guide for what the Onboarding Journey and Profile editor must collect from the user.

---

## 1. Core Profile Sections & Fields

### A. Contact & Identity Information
For on-campus recruitment, contact details must represent official credentials.
* **Full Name** (String, Required)
* **Phone Number** (String, Required, formatted e.g., `+91-XXXXX-XXXXX`)
* **College Email** (String, Required, e.g., `@nsut.ac.in` by default)
* **Personal Email** (String, Optional/Alternate)
* **LinkedIn Profile Link** (URL, Required)
* **GitHub Profile Link** (URL, Required for tech roles)
* **LeetCode Profile Link** (URL, Optional/Highly recommended for tech roles)
* **Codolio Profile Link** (URL, Optional) //can add other coding platform // user can add link by selecting option [ADD OTHER] and enter link manually // 
* **Portfolio Website Link** (URL, Optional)

### B. Education Details (High Priority)
On-campus placement resumes are heavily scrutinized for academic details.
* **Undergraduate Degree / Branch** (e.g., *Bachelor of Technology - Computer Science & Data Science*)
* **Institution Name** (e.g., *Netaji Subhas University of Technology, Delhi*)
* **Duration** (e.g., *2023 - 2027*)
* **Current CGPA** (Float, Required, e.g., `8.29/10`)
* **CGPA Type** (Dropdown: *With Drop*, *Without Drop* if applicable to college rules)
* **Semester-wise SGPA** (List of Floats, Optional/Advanced)
* **Key Subject Grades** (List of Key Core Subjects & Grades, e.g., *DBMS (A+)*, *Algorithms (O)*)
* **High School (Class XII) Details**:
  * **School Name** (String, Required)
  * **Year of Completion** (Integer, Required)
  * **Board** (Dropdown/String, e.g., *CBSE*, *ICSE*, *State Board*)
  * **Percentage / CGPA** (Float, Required, e.g., `91.8%`)
* **Secondary School (Class X) Details**:
  * **School Name** (String, Required)
  * **Year of Completion** (Integer, Required)
  * **Board** (Dropdown/String, e.g., *CBSE*, *ICSE*, *State Board*)
  * **Percentage / CGPA** (Float, Required, e.g., `95.2%`)

### C. Technical Projects
Projects demonstrate hands-on expertise and must highlight specific tech stacks.
* **Project Title** (String, Required)
* **Project GitHub Link** (URL, Optional but highly recommended)
* **Duration** (String, e.g., `Dec 2024 – Jan 2025`)
* **Tech Stack Used** (List of Strings/Tags, e.g., `[Kotlin, Jetpack Compose, Firebase]`)
* **Project Description / Objective** (String, Short summary)
* **Key Achievements / Bullet Points** (List of Strings, 3-4 points per project)
  * *Constraint*: Must be quantified (e.g., "*Reduced code duplication by 40%*") and action-verb driven.
  * *AI Generation Source*: Repo structure scanning + automated bullet generation.

### D. Internships & Work Experience
Professional exposure is a major differentiator.
* **Company/Organization Name** (String)
* **Role/Title** (String, e.g., *AI Engineer Intern*)
* **Duration** (String, e.g., `Jan 2026 - Apr 2026`)
* **Experience Type** (Dropdown: *Tech*, *Non-Tech*)
* **Key Responsibilities / Achievements** (List of Strings, action-oriented, quantified bullets)

### E. Leadership & Positions of Responsibility
Crucial for demonstrating organizational and team-management skills.
* **Organization Name** (String, e.g., *Training and Placement Cell, NSUT*)
* **Role/Title** (String, e.g., *Assistant Placement Coordinator*)
* **Duration** (String, e.g., `Apr 2025 – Present`)
* **Position Type** (Dropdown: *Tech Coordination*, *Non-Tech Management*)
* **Key Contributions** (List of Strings, e.g., "*Supported 200+ students and coordinated with 10+ companies*")

### F. Technical Skills (Tech Resumes Only)
Categorized list of proficiencies with clear indicators.
* **Programming Languages** (List of Tags, e.g., `C++ (Advanced)`, `Kotlin (Intermediate)`)
* **Frameworks & Libraries** (List of Tags, e.g., `React`, `Jetpack Compose`, `Astro`)
* **Mobile Development** (List of Tags)
* **Backend & Database** (List of Tags, e.g., `Firebase`, `PostgreSQL`, `FastAPI`)
* **Tools & IDEs** (List of Tags, e.g., `Git`, `Android Studio`, `Docker`)
* **Areas of Interest** (List of Tags, e.g., `Machine Learning`, `Distributed Systems`)

### G. Academic & Competitive Achievements (High Priority)
Validates problem-solving caliber.
* **Competitive Programming Profiles**:
  * **Codeforces Rating** (Integer/String, e.g., `989`)
  * **LeetCode Problems Solved** (Integer, e.g., `350+`)
* **Competitive Exam Ranks**:
  * **JEE Mains rank/percentile** (e.g., *AIR 11,056 (99.06 percentile)*)
  * **Board Merit Awards** (e.g., *Top 0.1% in Mathematics*)
* **Academic Honors** (e.g., *Consistent 8.19+ CGPA throughout college*)

### H. Certifications & Online Courses
* **Course/Certificate Name** (String)
* **Issuing Organization** (String, e.g., *IIT Madras / NPTEL*)
* **Duration/Date** (String)
* **Certificate Link** (URL, Required for verification)
* **Key Learning Areas** (List of Strings)

### I. Extracurricular Activities (Optional but Recommended)
* **Activity/Club Name** (String, e.g., *Dramatic Society (Ashwamedh)*)
* **Role** (String, e.g., *Member*, *Volunteer*)
* **Duration** (String)
* **Key Contributions** (List of Strings)

---

## 2. On-Campus Specific Verification & Compilation Constraints
When translating these details into the LaTeX compiler:
1. **Logo Requirement**: The college logo (e.g., NSUT logo) must be present in the header.
2. **Email Defaults**: The system must enforce the `@nsut.ac.in` college email by default unless the user explicitly changes it.
3. **One-Page Enforcer**: All sections selected must fit into exactly one page.
4. **Formatting Rules**: Single-column layout, bold headings, no objective section, tech stacks listed in front of projects.

---

## 3. Pending Interaction Questions for Functional Design
These questions will be asked of the user during the behavioral workflow design to finalize the implementation of the profile builder:

1. **Custom Links/Labels**: Should we let users add custom links (e.g., Behance, Devpost) or stick to a predefined list (GitHub, LeetCode, etc.)?
2. **Education Depth**: Should the form ask for individual subject grades or keep it simple with degree and CGPA?
3. **Project Manual Bypass**: Can users write their own project bullets instead of scanning GitHub? What is the project limit during onboarding?
4. **Experience Separation**: Should Internships and Positions of Responsibility be separate input pages or one unified list with dropdown types?
5. **Skill Tagging & Proficiency**: Do we use tag inputs? How do we ask for and display skill proficiency levels?
6. **Layout/Progress**: Should onboarding be a single long scroll, or a multi-step wizard (tabs or steps)?
