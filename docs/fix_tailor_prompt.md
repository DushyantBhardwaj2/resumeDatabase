# Prompt for OpenCode: Fix Tailor Generation (Stuck Spinner)

Please use this prompt to instruct OpenCode to fix the `/tailor` page generation issue where the interface gets stuck on "Matching your Career Vault bullets...".

***

**Copy and paste the following to OpenCode:**

Please investigate and fix the Tailoring Generation pipeline (`/tailor` page) which gets stuck on the "Matching your Career Vault bullets..." spinner.

Please address the following bugs and architectural issues:

### 1. Fix the Frontend Error UI Bug
In `frontend/src/components/generate/GenerateChatWorkspace.tsx`, inside the `catch` block of `handleSubmitJD`, the application attempts to show an error message by adding a new chat entry:
```tsx
{ id: 'error-' + Date.now(), role: 'assistant', type: 'generating', content: 'Generation failed. Please try again.' }
```
Because the `type` is still set to `'generating'`, the chat UI continues to render the spinning loader icon next to the error text! 
- **Fix:** Add a new `type` (e.g., `'error'` or `'system-message'`) to the `ChatEntry` type union. Update the rendering logic in `GenerateChatWorkspace.tsx` to display errors with a distinct UI (e.g., a red text color or error icon) without the loading spinner.

### 2. Investigate Backend AI Hang/Timeout
The backend endpoint `POST /api/protected/resume/tailor` in `backend/src/index.ts` relies on `ResumeUseCases.tailorResume`, which makes requests using `OpenCodeZenAIService` (`backend/src/infrastructure/ai/index.ts`).
- Verify if the `deepseek-v4-flash-free` model is valid and responding correctly.
- Ensure that if the AI API throws a `400` or `500` error, it is caught and returned to the frontend immediately, rather than swallowing the error or hanging until the 50-second AbortController timeout.

### 3. Optimize Sequential AI Calls
Currently, `tailorResume` makes two sequential AI calls:
1. Bullet Selection (`this.bulletSelectorPrompt`)
2. Summary Generation (optional, in a `try/catch`)
This doubles the response time for the user. 
- **Fix:** If the summary generation is truly optional, either run it in parallel using `Promise.allSettled`, or remove it entirely to ensure the generation feels snappy and responsive. The current sequential approach increases the likelihood of a 504 Gateway Timeout on Vercel/Render.

**Please implement these fixes and wait for my review to ensure the generation completes successfully.**
