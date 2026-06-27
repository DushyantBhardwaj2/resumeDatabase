# Prompt for OpenCode: Fix Hydration & 500 Errors

Please use this prompt to instruct OpenCode to fix the Hydration Mismatch in `AppLayout.tsx` and the Backend 500 error on the Tailor endpoint.

***

**Copy and paste the following to OpenCode:**

Please investigate and fix the following two critical errors that are occurring when navigating to the `/tailor` page:

### 1. Fix the React Hydration Mismatch (`frontend/src/components/layout/app-layout.tsx`)
There is a hydration error occurring because the `<main>` element's `style` attribute is being calculated using `isDesktop`, which relies on `window.matchMedia`:
```tsx
const [isDesktop, setIsDesktop] = useState(() =>
  typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
)
// ...
<main style={{ paddingLeft: desktopPadding }}>
```
Since `window` is undefined on the server, the server renders `padding-left: 0px`, but the client renders `padding-left: 228px`.

**Fix Strategy:** 
Remove the inline `style` attribute and the `isDesktop` state entirely. Rely on Tailwind CSS classes to handle the responsive padding. You can dynamically apply classes like `lg:pl-[228px]` or `lg:pl-[56px]` based on the `sidebarCollapsed` state. This ensures the server and client render the same HTML classes, and the browser's CSS engine handles the media query logic.

### 2. Fix the 500 Internal Server Error (`/api/protected/resume/tailor`)
The `api/protected/resume/tailor` endpoint is failing with a HTTP 500 error, resulting in a broken generation pipeline.
This error is likely tied to the `tailorResume` use case in `backend/src/core/application/use-cases/resume-use-cases.ts`, which makes calls to `OpenCodeZenAIService` (`backend/src/infrastructure/ai/index.ts`).
- Please check the AI service code and ensure that the backend correctly handles AI timeouts, malformed API keys, or invalid AI models (`deepseek-v4-flash-free`). 
- If `OpenCodeZenAIService` throws an exception, ensure the API route correctly logs the actual error string and bubbles it up to the frontend so the frontend doesn't swallow it.
- **Optimization:** If the 500 error is due to a timeout (like the 50-second AbortController timeout), refactor the AI calls (bullet selection and summary generation) so they run in parallel instead of sequentially to drastically reduce execution time.

**Please implement these changes and notify me when they are complete.**
