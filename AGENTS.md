<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Current Architecture Rules — Resumint (Phase 6 Final)

The Resumint application architecture has stabilized around a **Chat-Driven Career Vault** and a **Split-Screen Live Builder**. Do NOT refer to old development phases (Phase 1-5). Follow these structural rules strictly:

### 1. Routing Convention — ALL authenticated backend routes use `/api/protected/*`
The Vercel frontend proxies all `/api/*` requests to the Render backend. **Every route that requires authentication** must be under the `/api/protected/*` namespace. The Hono middleware in `backend/src/index.ts` automatically checks the session for all matching paths.

*Do not use old, deprecated routes like `/api/resume/parse` or `/api/resume/compile`. Use `/api/protected/...`.*

Routes that do NOT require auth (e.g., `GET /api/health`) stay outside `/api/protected/*`.

### 2. The Chat API Layer
The interaction with the AI is driven by three primary backend routes:
- `POST /api/protected/chat/interact` — Intent parsing & reply generation. Determines whether to show a Data Upload widget, a Checklist widget, etc.
- `POST /api/protected/ai/expand-vault` — Takes a brief experience/project description and expands it into 10-12 comprehensive `VaultBullet` items.
- `POST /api/protected/ai/select-bullets` — Matches the exhaustive vault against a specific Job Description (JD) to recommend the best 3-4 bullets.

### 3. Frontend State & Navigation
- **Zustand Stores**: State is NOT managed locally for the core builder. Use `useChatStore` (for messages and onboarding phases) and `useBuilderStore` (for the split-screen state, toggling bullets, and triggering PDF compilation).
- **Onboarding**: The legacy multi-step wizard is dead. Onboarding is handled exclusively by the Chat Interface on `/onboarding`.
- **Builder Layout**: The `/tailor/builder` page uses a 35/65 split-screen layout. The left side is the `ChatContainer` / Checklist, and the right side is the `LivePdfRenderer`.

### 4. Live PDF Compilation
- PDF generation is handled via **server-side LaTeX**.
- The `LivePdfRenderer` frontend component debounces state changes by 800ms.
- It calls `POST /api/protected/resume/compile-live` on the backend, which dynamically filters the user's `VaultBullet` lists based on the `selectedBulletIds` array, generates a `.tex` file, runs `pdflatex`, and returns a raw PDF blob.

### 5. UI & Styling Rules
- **Framework**: Tailwind CSS v4.
- **Aesthetic**: Premium, modern, glassmorphism. Use `globals.css` color variables (e.g., `var(--color-primary)`) and effects like `backdrop-blur-md` heavily.
- **Icons**: Use `@phosphor-icons/react`, NOT `lucide-react`.
- **Components**: Use the custom base components in `src/components/ui/` (Button, Input, Card, Badge, etc.). Do not install external component libraries like `shadcn/ui`.
