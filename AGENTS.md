<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Session Log — Phase 4 Complete (2026-06-14)

### What was built
- **Step 4.1**: History API — `GET /api/history`, `GET /api/history/[id]`, `DELETE /api/history/[id]`, `PUT /api/history/[id]/styling`
- **Step 4.2**: History page at `/history` — cards view, preview modal, clone/edit/delete with confirmation, search/filter
- **Step 4.3**: Styling panel in ResumePreview — 3 templates (Classic/Modern/Minimal), color picker, font selector (Times New Roman/Inter/JetBrains Mono), spacing (compact/normal/relaxed), Save Style via API
- **Step 4.4**: Dark mode toggle via `next-themes` in dashboard header + mobile menu; glassmorphism CSS class; fade/slide/scale animations; `:focus-visible` a11y; custom scrollbar
- **Step 4.5**: Build passes, ESLint clean (0 errors, 2 img warnings), checklist updated to 84/84

### Refactor — LaTeX PDF compilation (2026-06-14)
- Replaced `window.print()` CSS-based PDF export with server-side LaTeX compilation
- Created `src/lib/latex-template.ts` — `fillLatexTemplate()` maps profile + AI-tailored data into `docs/resume_template.tex` placeholders
- Created `POST /api/resume/compile-latex` — accepts LaTeX source, runs `pdflatex` locally, returns PDF binary
- Updated `ResumePreview` — "Download PDF" button calls compile API instead of `window.print()`; removed old print-CSS block
- Template handles optional entries (education/experience/projects up to 10 slots), strips unused rows, removes extracurricular section
- `pdflatex` (MiKTeX 25.12) is locally available for compilation

### Status
- **Phase 1**: 22/22
- **Phase 2**: 21/21
- **Phase 3**: 18/18
- **Phase 4**: 23/23
- **Total**: **84/84 — MVP complete**
