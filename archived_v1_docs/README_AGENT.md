# Agent Usage Guide (Resume Workspace)

This workspace is organized so an agent can build tech or non‑tech LaTeX resumes reliably.

- Entry files:
  - Tech: `main.tex`
  - Non‑tech: `main_nontech_template.tex`
- Rules: `Resume_Edit_Rules.md` (must be followed: one page, keep logo, no objective, default email)
- Database: `resume_builder/data/resume_db.yaml` plus `Resume_Database_README.md`
- Templates: `resume_builder/templates/*` (optional Jinja2 templates)
- Outputs: `Generated_Files/`

## Agent behavior expectations

1. Read `Resume_Edit_Rules.md` and only use skills present in the database files.
2. When a JD is provided, integrate only matching keywords—do not invent new skills.
3. Keep one page, retain NSUT logo, and use college email unless otherwise instructed.
4. Prefer editing the active entry file (tech or non‑tech) unless the user specifies a different target.
5. Save outputs under `Generated_Files/` when generating alternates.

## Common tasks

- “Make a non‑tech resume from this JD”: Edit `main_nontech_template.tex` accordingly and save.
- “Make a tech resume tailored to X”: Edit `main.tex` accordingly and save.
- “Use my personal email”: Update header email only (rules allow override when asked).

