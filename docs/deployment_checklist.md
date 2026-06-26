# Deployment Checklist

## Environment Variables

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g. `https://resumint-backend.onrender.com`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend URL (e.g. `https://resumint.vercel.app`) |

No Better Auth or Google secrets are needed on the frontend — OAuth is handled server-side by the backend.

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Better Auth secret (must match across deployments) |
| `BETTER_AUTH_URL` | Yes | Frontend URL for OAuth callbacks (e.g. `https://resumint.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `OPENCODE_API_KEY` | Yes | API key for AI resume features (OpenCode Zen / OpenAI-compatible) |
| `VERCEL_FRONTEND_URL` | Yes | Frontend URL for CORS (e.g. `https://resumint.vercel.app`) |
| `PORT` | No | Server port (defaults to `8080`) |
| `NODE_ENV` | No | `production` on Render |

## Database

### Prisma migrate — existing database with data

```bash
cd backend
npx prisma migrate deploy
```

This applies all pending migrations, including the `certifications → certificates` rename (idempotent — safe to re-run).

### Fresh database — no existing data

```bash
cd backend
npx prisma db push
```

Creates all tables from the current Prisma schema (no migration history needed).

### Local development database

```bash
cd backend
npx prisma migrate dev
```

If starting from scratch:

```bash
npx prisma migrate dev --name init
```

## Build Commands

### Frontend (Vercel)

- **Framework preset:** Next.js
- **Build command:** `npm run build:frontend`
- **Output directory:** `.next`
- **Install command:** `npm install`
- **Node version:** 22.x

`frontend/vercel.json` rewrites `/api/*` to the Render backend.

### Backend (Render)

- **Runtime:** Node
- **Build command:** `npm run build:backend`
- **Start command:** `npm run start` (runs `node dist/index.js`)
- **Node version:** 22.x

> **Important:** The backend requires `pdflatex` (TeX Live or MiKTeX) for PDF generation.
>
> On Render Node runtime, install TeX Live via a `render.yaml` pre-build command or a startup hook:
> ```bash
> sudo apt-get update && sudo apt-get install -y texlive-latex-base texlive-latex-recommended texlive-fonts-recommended
> ```
>
> If the Node runtime cannot install `pdflatex`, use the Dockerfile at `server/Dockerfile` instead (deprecated — see repo history).

## OAuth / Auth Callbacks

### Google OAuth

Add these authorized redirect URIs in Google Cloud Console:

| Environment | Redirect URI |
|---|---|
| Development | `http://localhost:3000/api/auth/callback/google` |
| Production | `https://resumint.vercel.app/api/auth/callback/google` |

### Better Auth

`BETTER_AUTH_SECRET` must be identical in both frontend and backend environments.

## Post-Deploy Smoke Tests

Run through these manually after deployment (or use `npm run test:smoke`):

1. **Health check:** `GET /api/health` → `{"status":"ok"}`
2. **Auth flow:** Navigate to `/sign-in`, click Google sign-in, complete OAuth
3. **Onboarding:** After sign-in, upload a resume or skip → profile saved
4. **Profile API:** `GET /api/protected/profile` → returns profile JSON
5. **Tailor page:** Navigate to `/tailor`, enter JD, submit
6. **Checklist:** Toggle bullets on/off → live preview updates
7. **PDF download:** Click Export → PDF downloads with NSUT logo
8. **History:** Navigate to `/history` → entries appear

## Auth Route Rule

All authenticated backend routes MUST use `/api/protected/*`. The backend middleware (`backend/src/index.ts`) checks the session for all matching paths. API routes outside `/api/protected/*` are treated as public.

## LaTeX Dependencies

The backend calls `pdflatex` via `execSync`. Required packages:

- `pdflatex` (TeX Live or MiKTeX)
- Packages used by templates: `graphicx`, `booktabs`, `url`, `enumitem`, `palatino`, `tabularx`, `hyperref`, `color`

Install on Ubuntu/Debian:

```bash
sudo apt-get install -y texlive-latex-base texlive-latex-recommended texlive-fonts-recommended
```

## Troubleshooting

### PDF compilation fails

Check:
- `pdflatex` is installed and on PATH
- NSUT_logo.png exists in `dist/infrastructure/latex/templates/<template>/`
- Template `.tex` file has no syntax errors
- Temp directory is writable

### Auth redirect loop

Check:
- `BETTER_AUTH_SECRET` matches between frontend and backend
- OAuth redirect URIs are correct in Google Cloud Console
- CORS origin (`VERCEL_FRONTEND_URL`) allows the frontend domain

### 401 on `/api/protected/*`

The session cookie may not be forwarded. Ensure:
- `credentials: 'include'` is set on fetch calls
- `frontend/src/lib/fetch.ts` forwards cookies correctly
- CORS configuration allows credentials
