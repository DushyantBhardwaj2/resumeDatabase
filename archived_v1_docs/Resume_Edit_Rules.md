# Resume Editing Rules

This file defines the conventions and guidelines for future edits to the LaTeX resume (`main.tex`). Follow these rules to maintain consistency, readability, and ATS optimization.

## 1. Document Structure

- Keep the resume to **one page**. Avoid adding new sections unless absolutely necessary.
- Maintain section order:
  1. Header (Name, Contact, Links)
  2. Objective (when targeting specific roles)
  3. Education
  4. Projects
  5. Academic Achievements
  6. Positions of Responsibility
  7. Internships & Work Experience
  8. Technical Skills
  9. Certifications & Courses (optional)
  10. Extracurricular Activities (optional)
  11. Awards & Honors (optional)

## 2. Formatting

- Use the `
ewcommand{\resheading}` and `\ressubheading` macros for consistent headings.
- Use `itemize` lists with `noitemsep, topsep=4pt` for bullets.
- Limit each bullet to **one concise sentence**.
- Use **bold** for role titles and section labels.
- Dates should be formatted `Month Year – Month Year` or `Year–Year`.
- Quantify achievements (e.g., “Reduced load time by 40%,” “Coordinated 200+ students”).

## 3. Content Guidelines

- Lead with **strong action verbs**: developed, optimized, designed, achieved, led.
- Focus on **impact**: include metrics, scale, outcomes.
- Tailor the Objective and Project descriptions to the **target role** and company.
- Use ATS-friendly keywords from the job description (e.g., scalability, cross-functional, mobile development, Go, Python).
- Remove personal pronouns (I, my) and keep bullets **impersonal**.
- Avoid jargon or overly technical details that do not align with the role.

## 4. Technical Skills

- List languages, tools, frameworks in **descending order** of proficiency.
- Update the skills list to include any new technologies relevant to the target role.
- Specify proficiency level in parentheses (e.g., Python (Intermediate), Go (Familiar)).

## 5. Version Control

- After edits, compile with `pdflatex main.tex` and verify no errors or overfull boxes.
- Commit changes to Git with a clear message referencing the section edited (e.g., `[Resume] Update Objective for Uber`).

Last updated: July 12, 2025

## 6. Custom Rules

1. Never change the format of the LaTeX code without asking first.
2. Always keep the resume only one page long.
3. Never remove the logo.
4. Add the tech stack in front of each project entry.
5. Include required certifications when they match the job profile.
6. If a job profile requires a skill or section not in the resume database, ask for your status on that before editing the database.
7. Always use the resume database to guide edits to the current resume.
8. Do not include an Objective section in the resume.
9. Use the college email <dushyant.bhardwaj.ug23@nsut.ac.in> by default unless explicitly asked to use another email.

## 7. Resume Schema

- Header:  (See structured schema below)
- Objective: (See structured schema below)
- Education: (See structured schema below)
- Projects: (See structured schema below)
- Academic Achievements: (See structured schema below)
- Positions of Responsibility: (See structured schema below)
- Technical Skills: (See structured schema below)
- Certifications & Courses: (See structured schema below)
- Extracurricular Activities: (See structured schema below)
- Awards & Honors: (See structured schema below)

```yaml
Resume:
  header:
    name: string
    contact:
      phone: string
      emails: [string]
      links: [string]
  objective: string
  education:
    - degree: string
      year: string
      institution: string
      cgpa_pct: string
  projects:
    - title: string
      duration: string
      tech_stack: [string]
      description: string
      achievements: [string]
      link: string
  academic_achievements: [string]
  positions_of_responsibility:
    - role: string
      organization: string
      duration: string
      responsibilities: [string]
  technical_skills:
    languages: [string]
    tools_ides: [string]
    frameworks: [string]
    coursework: [string]
    interests: [string]
  certifications:
    - name: string
      organization: string
      date: string
      link: string
      key_learnings: [string]
  extracurricular:
    - activity: string
      organization: string
      duration: string
      contributions: [string]
  awards:
    - title: string
      year: string
      description: string
```
