# Vercel Deployment Guide

## Overview

The Next.js frontend is deployed on Vercel. Better Auth (authentication) is handled **directly on Vercel** via a local API route handler. All other `/api/*` requests are proxied to the Render backend via URL rewrites.

## Architecture

```
User ──> Vercel (Next.js) ──rewrite──> Render (Express backend)
           resumint.vercel.app           resumint-backend-j047.onrender.com
               │
               └── /api/auth/* ──handled locally──> Better Auth (Prisma → Supabase)
```

The Next.js app handles:
- Page routing (App Router)
- Static assets and SSR
- **Authentication** — Better Auth API (`/api/auth/*`) runs directly on Vercel via `src/app/api/auth/[...all]/route.ts`. This ensures session cookies are set on the same domain, eliminating cross-domain cookie issues.
- All other API logic is delegated to the Express backend on Render

## Better Auth Route Handler

Auth requests are handled locally on Vercel (file routes take precedence over rewrites):

**`src/app/api/auth/[...all]/route.ts`**:
```ts
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/config/auth"

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth)
```

The shared `src/config/auth.ts` includes the `nextCookies()` plugin for proper Next.js cookie management:

```ts
import { nextCookies } from "better-auth/next-js"

export const auth = betterAuth({
  // ...
  plugins: [nextCookies()],
  // ...
})
```

## vercel.json

The deployment config is at the project root:

```json
{
  "buildCommand": "next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://resumint-backend-j047.onrender.com/api/:path*" }
  ]
}
```

### Key details

- **`framework: "nextjs"`** — Vercel auto-detects Next.js; this explicitly sets the build preset
- **`installCommand: "npm install"`** — Installs dependencies from root `package.json` (shared deps: better-auth client, next-themes, sonner, zod, etc.)
- **`rewrites`** — All `/api/*` requests are forwarded to the Render backend except `/api/auth/*` which is handled locally by the Next.js route handler (file routes take precedence over rewrites)
- **`outputDirectory: ".next"`** — Standard Next.js output directory

## Sign-In Flow

1. User clicks "Sign In" on the home page
2. The client-side `signIn.social({ provider: "google", callbackURL: "/auth/redirect" })` sends a POST to `/api/auth/sign-in/social`
3. The request is handled by the **local** Better Auth route handler on Vercel
4. Better Auth redirects the user to Google OAuth
5. Google calls back to `/api/auth/callback/google` on Vercel (handled locally)
6. Better Auth creates a session in the database and sets the session cookie on the Vercel domain
7. The user is redirected to `/auth/redirect`
8. The `/auth/redirect` server component calls `getServerSession()` to verify the session, then redirects to `/dashboard` (or `/onboarding` for first-time users)

### Error Handling

If the session or profile fetch fails, the page gracefully redirects to the home page instead of crashing with a 500. An error boundary at `src/app/auth/redirect/error.tsx` catches unexpected rendering errors and shows a friendly message.

## Environment Variables

Set these in the Vercel dashboard (Settings → Environment Variables):

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | The Vercel deployment URL (e.g., `https://resumint.vercel.app`) |
| `BETTER_AUTH_URL` | Yes | Must match `NEXT_PUBLIC_APP_URL` (for OAuth callback generation) |
| `BETTER_AUTH_SECRET` | Yes | Must match the Render backend's secret (used to encrypt session cookies) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase) |
| `OPENCODE_API_KEY` | Yes | API key for the AI provider |

> **Note:** `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and `CORS_ORIGIN` on the Render side must match the Vercel domain exactly. If you change the Vercel deployment URL, update both sides.

## Google OAuth Configuration

In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), the Authorized redirect URI must point to the Vercel domain:

```
https://resumint.vercel.app/api/auth/callback/google
```

## Deployment Flow

1. Push to the `main` branch (or connect Vercel to the GitHub repo)
2. Vercel automatically detects the Next.js project, runs `next build`, and deploys
3. The frontend is available at `https://resumint.vercel.app`

## Local Preview

To test the full stack locally:

1. Start the backend: `cd server && npm run dev` (runs on `http://localhost:8080`)
2. Start the frontend: `npm run dev` (runs on `http://localhost:3000`)
3. The Vercel `rewrites` only apply in production; during development, API calls go directly to `http://localhost:8080` (configured via `BETTER_AUTH_URL` in your `.env.local`)

## Troubleshooting

- **500 error at `/auth/redirect` after sign-in**: The most common cause is missing `BETTER_AUTH_URL` env var — it must be set to the Vercel domain (e.g., `https://resumint.vercel.app`). Also verify `BETTER_AUTH_SECRET` is set and matches Render. Check that `DATABASE_URL` is accessible from Vercel.
- **API calls returning 404**: Verify the `rewrites` destination URL in `vercel.json` matches the deployed Render URL. Check Render logs to confirm the backend is running.
- **OAuth callback errors**: Ensure `BETTER_AUTH_URL` is set to the Vercel domain (not `localhost` or the Render domain). Verify the Google OAuth redirect URI matches exactly.
- **CORS errors**: The backend's `CORS_ORIGIN` must include the Vercel domain. This is configured in the Render dashboard env vars.
- **Build failures**: Check Vercel build logs. Common issues: missing dependencies, TypeScript errors, or mismatched Next.js versions.
