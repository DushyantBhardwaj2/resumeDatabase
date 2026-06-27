# Prompt for OpenCode: Overhaul Onboarding Page

Please use this prompt to instruct OpenCode to overhaul the `/onboarding` page and fix the chat initialization. 

***

**Copy and paste the following to OpenCode:**

Please overhaul the Onboarding Page (`frontend/src/app/onboarding/page.tsx`) to match the Premium Chat Interface specifications outlined in `docs/chat_interface_planning.md` and `docs/ui_design.md`. Currently, the page looks very basic and fails to show the initial greeting message or ask for the user's resume.

Please address the following tasks:

### 1. Fix the Initial Greeting & Resume Ask (The "Start a conversation" bug)
When a user navigates to `/onboarding`, the chat is completely empty and shows "Start a conversation to build your resume...". It is supposed to immediately greet the user and show the `UPLOAD_DROPZONE` widget to ask for their resume.
- Investigate why `addMessage` in the `useEffect` of `onboarding/page.tsx` is failing to render the initial greeting. 
- Ensure that the greeting message (`"Hi! I'm your Resumint Assistant. 👋 Let's build your Career Vault...\n\nWhat would you like to do?"`) and its associated widget (`UPLOAD_DROPZONE`) are reliably pushed to the `ONBOARDING` chat mode and displayed when the page mounts.
- Verify that `frontend/src/components/chat/widgets/ResumeUploadWidget.tsx` exists and correctly renders the drag-and-drop resume upload zone.

### 2. Implement "Visually Stunning" UI (Glassmorphism & Layout)
The current onboarding header is a simple bordered `div` with no personality. According to the design specs:
- The UI must utilize our Tailwind v4 design system, specifically leveraging glassmorphism (the `.glass` utility class).
- Add smooth micro-animations (`animate-fade-up`, `animate-slide-left`) to the page mounting and chat interactions.
- Make the layout feel like a premium SaaS application rather than a basic text interface. Center the chat in a prominent glass card or utilize a full-bleed dark/light mode aesthetic.

### 3. State Machine & Navigation
- Ensure the internal state machine (`currentPhase`) correctly shifts from `GREETING` to `AWAITING_RESUME_OR_TEXT` and handles the user's uploaded file properly.
- If the user skips the upload and just starts typing, ensure the chat seamlessly handles their text input and proceeds through the profile-building phases.

**Please implement these changes and wait for my review before moving to other parts of the application.**
