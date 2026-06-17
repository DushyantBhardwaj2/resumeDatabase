# Overleaf Integration Prompt for OpenCode / AI Assistant

**Goal:** Replace our current local/server-based LaTeX compilation with a seamless "Open in Overleaf" integration at the end of the resume tailoring flow.

**Context:**
Currently, our Next.js application tries to compile LaTeX code into a PDF using `pdflatex` (either locally or via an external microservice). We want to completely eliminate the need for a backend LaTeX compiler. Instead, once the AI generates the tailored LaTeX code string, we want to present the user with an "Open in Overleaf" button. Clicking this button should securely send the LaTeX code to Overleaf, automatically creating a new project for them.

**Technical Requirements & Instructions for the AI:**

1. **The Overleaf API Mechanism:**
   - Overleaf provides a free integration to open raw LaTeX code directly in their editor.
   - It requires an HTML `<form>` that makes a `POST` request to `https://www.overleaf.com/docs`.
   - The form must contain a hidden `<input>` with `name="snip"`. The `value` of this input must be the raw LaTeX code string.
   - The form should use `target="_blank"` so it opens in a new tab.

2. **UI Implementation (The Tailoring End-Step):**
   - Locate the final step in the resume tailoring flow where the user currently clicks "Download PDF" (this is likely in `src/app/tailor/page.tsx` or a related preview component).
   - Create a new React component called `OverleafButton` (e.g., in `src/components/ui/overleaf-button.tsx`).
   - The component should accept `latexCode: string` as a prop.
   - Replace the old backend PDF compilation logic with this new button. You no longer need to make API calls to `/api/resume/compile-latex`.

3. **Component Reference Code:**
   Here is the reference code for the component you need to build and integrate:
   ```tsx
   import { Button } from "@/components/ui/button"

   export function OverleafButton({ latexCode }: { latexCode: string }) {
     return (
       <form action="https://www.overleaf.com/docs" method="POST" target="_blank">
         {/* The 'snip' field securely sends the LaTeX string to Overleaf */}
         <input type="hidden" name="snip" value={latexCode} />
         
         <Button type="submit" variant="default">
           Open in Overleaf
         </Button>
       </form>
     )
   }
   ```

4. **Cleanup (Optional but recommended):**
   - You can safely bypass or remove the calls to the `LatexCompiler` in `src/infrastructure/latex/latex-compiler.ts` since the server no longer needs to compile PDFs. 

**Strict Constraints:**
- Do not attempt to use URL encoding (`GET` request) for the LaTeX code, as LaTeX strings easily exceed the browser's URL length limit. You MUST use the `<form method="POST">` approach.
- Ensure the user's generated LaTeX template maps properly to the `latexCode` prop.
