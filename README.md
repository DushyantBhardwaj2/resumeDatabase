# Resumint

AI-powered resume tailoring platform for NSUT students.

**Status**: MVP Phase 3/4 complete

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Auth**: Better Auth (Google OAuth, @nsut.ac.in domain restriction)
- **Database**: Supabase PostgreSQL via Prisma v7
- **AI**: OpenCode Zen (deepseek-v4-flash-free) — resume parsing, README summarization, resume tailoring
- **PDF**: Client-side print-based export
- **Styling**: Tailwind CSS v4

## Phases

| Phase | Status | Features |
|-------|--------|----------|
| 1: Auth & Parsing | ✅ Complete | Google OAuth, PDF upload, AI resume parsing, profile save |
| 2: Profile Dashboard | ✅ Complete | Dashboard layout, inline editing, completeness score, GitHub integration |
| 3: Resume Tailoring | ✅ Complete | JD input, AI tailoring engine, diff preview, PDF export |
| 4: History & Polish | 🔄 Pending | Resume history, templates, styling, polish |

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and sign in with an `@nsut.ac.in` Google account.

## Environment Variables

See `.env.example` for the required variables.
