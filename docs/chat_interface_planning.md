# 🚀 THE CAREER VAULT & PREMIUM CHAT INTERFACE: MASTER ARCHITECTURE & SPECIFICATION [v3.0 - MAXIMUM DEPTH]

> **Document Status:** FINAL ARCHITECTURAL BLUEPRINT (Extended Edition)
> **Target:** Complete overhaul of the `resumint` application to a Chat-Driven Career Vault interface.
> **Scope:** Exhaustive deep-dive. This document contains full code scaffolds, precise JSON schemas, complete AI prompt engineering with few-shot examples, state machine definitions, and exact database migration strategies.

---

## 📝 TABLE OF CONTENTS
1. [EXHAUSTIVE SESSION HISTORY & UX EVOLUTION](#1-exhaustive-session-history--ux-evolution)
2. [THE CAREER VAULT PHILOSOPHY (DEEP DIVE)](#2-the-career-vault-philosophy-deep-dive)
3. [DATABASE ARCHITECTURE & PRISMA MAPPINGS](#3-database-architecture--prisma-mappings)
4. [BACKEND API ARCHITECTURE & ENDPOINT SPECIFICATIONS](#4-backend-api-architecture--endpoint-specifications)
5. [AI SERVICE LAYER & PROMPT ENGINEERING](#5-ai-service-layer--prompt-engineering)
6. [FRONTEND STATE MANAGEMENT (ZUSTAND & CONTEXT)](#6-frontend-state-management-zustand--context)
7. [FRONTEND COMPONENT ARCHITECTURE & UI DESIGN](#7-frontend-component-architecture--ui-design)
8. [NATURAL LANGUAGE NAVIGATION & INTENT PARSING](#8-natural-language-navigation--intent-parsing)
9. [THE BUILDER: SPLIT-SCREEN CHAT & LIVE PDF PREVIEW](#9-the-builder-split-screen-chat--live-pdf-preview)
10. [LATEX COMPILATION & RENDER PIPELINE](#10-latex-compilation--render-pipeline)
11. [GRANULAR STEP-BY-STEP IMPLEMENTATION ROADMAP](#11-granular-step-by-step-implementation-roadmap)
12. [EDGE CASES, ERROR HANDLING & RECOVERY](#12-edge-cases-error-handling--recovery)
13. [FULL API SPECIFICATION (SWAGGER/OPENAPI MOCK)](#13-full-api-specification-swaggeropenapi-mock)
14. [UI/UX MOTION & MICRO-ANIMATION SPECS](#14-uiux-motion--micro-animation-specs)

---

## 1. EXHAUSTIVE SESSION HISTORY & UX EVOLUTION

### 1.1 The Genesis: Why Traditional Resume Builders Fail
In our initial discussions, we identified a critical flaw in the resume-building market:
*   **The Status Quo:** Current platforms take a pre-existing resume, slap a fresh UI or template on it, and maybe run a rudimentary ATS check. They assume the user's base resume is static.
*   **The Flaw:** Real-world projects and experiences are multi-faceted. A single full-stack project involves frontend engineering, backend architecture, database modeling, deployment (DevOps), and project management.
*   **The Problem:** If a user applies for a strictly Frontend role, their resume should emphasize the UI/UX, React, and performance optimization aspects of that project. If they apply for a Backend role, it should emphasize the API design, database queries, and server scaling.
*   **The Result:** Users are forced to manually maintain 10 different Word documents or PDFs for different job variants.

### 1.2 The Paradigm Shift: "The Career Vault"
To solve this, we conceptualized the "Career Vault".
1.  **Data Ingestion over Document Creation:** We do not ask the user to "build a resume." We ask the user to "build their profile." This is fundamentally different.
2.  **Omni-Directional Bullets (10-12 Points):** Instead of storing 3 bullet points for a project, our AI generates and stores **10 to 12 highly detailed bullet points** for *every* project and experience. 
    *   *Direct Quote from Session:* "We will add 10-12 points on our side so that whenever the user is giving our job description, we particularly pick the point that is from a project that is related to that JD. For example a JD is about ML and AI and a project can contain ML, AI, and Web dev both. Our task is to show only the ML points of the project to the user so that he can select three or four points."
3.  **The Master Database:** This repository of 10-12 bullets per item forms the "Vault". It is exhaustive. It covers every angle.
4.  **Contextual Projection:** When the user provides a specific Job Description (JD), the system does not create a new resume from scratch. It acts as a filter, projecting only the 3-4 bullets from the Vault that mathematically/semantically align with the JD's requirements.

### 1.3 The UX Pivot: The Premium Chat Interface
We agreed that standard multi-step forms (wizards) are outdated, boring, and do not convey the "premium AI" feel required for a modern SaaS product.
*   **The Chatbot as the Primary Interface:** The entire application must be driven by a conversational AI assistant.
*   **Aesthetics:** The UI must be visually stunning, utilizing our Tailwind v4 design system. It must feature glassmorphism (`.glass` class), smooth micro-animations (`animate-fade-up`, `animate-slide-left`), beautiful dark modes, and high-contrast typography.
*   **Conversational Onboarding:** Instead of a form that says "Enter your Name", the chatbot asks: *"Hi! I'm your Resumint Assistant. Let's build your Career Vault. You can upload an existing PDF resume, drop a GitHub link, or just type out your background."*
    *   *Direct Quote from Session:* "First of all there will be a signing window. As soon as the user signs in, it will be drawn towards the onboarding window where he has to provide either his resume or something about him... Without that we will not allow the user to move on because it is not good for us. Remember it is a resume or something about his profile. Don't just ask him to only fill in a resume."
*   **Hyperlinking & Context Parsing:** A crucial requirement discussed was handling certificates and external links. 
    *   *Direct Quote from Session:* "Sometimes what happens is a person gives a certificate and then gives us the link to the certificate so it will ask to store this certificate link so that we can hyperlink that in his or her resume."

### 1.4 The "Lockdown" Onboarding Flow
We established a strict operational rule:
*   **Mandatory Capture:** A user cannot access the main dashboard, the tailoring engine, or their history until their Career Vault is populated.
*   **The Guardrail:** As soon as the user logs in via BetterAuth (Google OAuth), Next.js middleware or layout logic must intercept their routing and lock them into the `/onboarding` chat interface until completion.

### 1.5 The Builder UI: Split-Screen Mastery
When building a tailored resume, the interface must transform to accommodate two simultaneous cognitive tasks.
*   *Direct Quote from Session:* "When the jade [JD] is put, it will go step step by step and then it will generate. How can I put this? What I want is the chat showing as: select your name, your GitHub profile, your LinkedIn profile... left panel is showing a live preview."
1.  **Left Panel (Chat & Controls):** The conversational interface where the user provides the JD. The AI responds with an interactive checklist widget representing the projects and the AI's top 3-4 selected bullets per project.
2.  **Right Panel (Live Preview):** A real-time PDF rendering of the resume.
*   **The Sync Requirement:** This was a heavily stressed point. If the user unchecks a bullet in the Left Panel and checks a different one from their Vault, the Right Panel PDF must update instantaneously. They must remain in perfect synchronization.

### 1.6 Natural Language Navigation (NLN)
A major pain point in standard wizards is moving backward.
*   **The Requirement:** *Direct Quote from Session:* "If the person is on the skills part and has to go back to the project part, he just has to type in the chat area, for example, 'I want to alter my projects' and then the chat will send it back to the project checklist."
*   **The Solution:** The AI must run an Intent Classifier, recognize the context shift, update the internal state machine, and dynamically inject the "Projects" widget back into the chat stream.

---

## 2. THE CAREER VAULT PHILOSOPHY (DEEP DIVE)

### 2.1 Anatomy of a Vault Bullet
A traditional resume builder stores strings:
`bullets: ["Built a web app", "Used React", "Increased speed by 20%"]`

The Career Vault stores semantic objects. Every single bullet point must become an entity:
```json
{
  "id": "vblt_1234abc",
  "text": "Architected a scalable microservices backend using Node.js and Docker, improving system resilience by 40%.",
  "aspects": ["Backend", "DevOps", "Node.js", "Docker", "Architecture"],
  "source": "AI_GENERATED",
  "confidenceScore": 0.95
}
```
By storing `aspects`, our tailoring engine can instantly perform keyword/semantic matching against a Job Description.

### 2.2 The 10-12 Bullet Expansion Strategy
When a user inputs a project (e.g., "I built a Twitter clone using Next.js and Firebase"), the AI must not just format that sentence. It must infer and expand.
*   **Prompt Directive:** *"Given the project description, generate 12 distinct bullet points. 3 focusing on Frontend/UI, 3 on Backend/Data, 3 on Performance/Optimization, and 3 on Soft Skills/Leadership/Impact."*
*   **The Result:** The user's vault instantly becomes a massive arsenal of potential resume points, covering every conceivable job application scenario for that project.

### 2.3 The Tailoring Engine's Role
The tailoring engine (`POST /api/protected/resume/tailor`) shifts from being a generative AI task to a **Filtering and Selection AI task**.
*   **Old Way:** Send the whole resume and the JD to OpenAI and ask it to rewrite the resume. (Slow, prone to hallucination, inconsistent formatting).
*   **New Way:** Send the Vault Bullets and the JD to the AI. Ask the AI: *"Return the IDs of the 4 best bullets for this JD."* (Extremely fast, deterministic, preserves user's exact wording, zero formatting hallucination).

---

## 3. DATABASE ARCHITECTURE & PRISMA MAPPINGS

### 3.1 The Beauty of the Current Schema
A thorough analysis of `schema.prisma` reveals a massive advantage:
```prisma
model Profile {
  id             String   @id @default(cuid())
  userId         String   @unique
  rawResumeText  String?
  contact        Json?
  education      Json?
  experience     Json?
  projects       Json?
  skills         Json?
  githubUsername String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```
Because `experience` and `projects` are defined as `Json?`, **we do not need to run Prisma database migrations (`npx prisma migrate dev`) to implement the Vault architecture.** The database layer is already perfectly decoupled from the strict TypeScript types.

### 3.2 TypeScript Type Overrides (`backend/src/core/domain/entities.ts`)
We will enforce the Vault architecture purely at the TypeScript compilation layer.

```typescript
// backend/src/core/domain/entities.ts

export type VaultBullet = {
  id: string; // Crucial: UUID/Cuid for React Keys and DB selection
  text: string;
  category?: 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'LEADERSHIP' | 'GENERAL';
  keywords: string[];
  isAIGenerated: boolean;
};

export type Contact = {
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

export type Education = {
  school: string;
  degree: string;
  gpa: string;
  graduationYear: string;
};

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  vaultBullets: VaultBullet[]; // REPLACES standard 'bullets: string[]'
};

export type ProjectItem = {
  id: string;
  title: string;
  url: string;
  techStack: string;
  vaultBullets: VaultBullet[]; // REPLACES standard 'bullets: string[]'
};

export type Certificate = {
  id: string;
  name: string;
  issuer: string;
  url: string; // The hyperlink requirement
  date?: string;
};

export type Skills = {
  languages: string[];
  frameworks: string[];
  tools: string[];
};

export type Profile = {
  contact: Contact;
  education: Education;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: Skills;
  certificates?: Certificate[]; // New addition
  githubUsername?: string;
};
```

### 3.3 The `TailoredResume` Schema
The `History` table (or whatever stores tailored resumes) must only store *references* to the Vault, plus any temporary modifications.
```typescript
export type TailoredResumeState = {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  // This is the core: Mapping a Project/Experience ID to an array of selected Bullet IDs
  selectedBulletIds: Record<string, string[]>; 
  customizations?: {
    // Overrides for this specific resume (e.g., tweaked a bullet slightly for this JD)
    bulletOverrides: Record<string, string>; 
  };
};
```

---

## 4. BACKEND API ARCHITECTURE & ENDPOINT SPECIFICATIONS

All endpoints live in `backend/src/index.ts` under the `/api/protected/*` Hono middleware. We must introduce new highly specialized endpoints to drive the chat interface.

### 4.1 Chat Intent & Response Endpoint
**`POST /api/protected/chat/interact`**

**Purpose:** The central nervous system of the conversational UI. It receives the entire message history and determines what the AI should say AND what internal UI state should change.

**Request Payload:**
```json
{
  "messages": [
    { "role": "assistant", "content": "Let's review your projects." },
    { "role": "user", "content": "Actually, I need to add AWS to my skills first." }
  ],
  "currentState": {
    "phase": "ONBOARDING_PROJECTS",
    "profileData": { ... }
  }
}
```

**Response Payload:**
```json
{
  "reply": "No problem, let's update your skills. I've brought up the skills input.",
  "intent": "NAVIGATE",
  "targetWidget": "SKILLS_EDITOR",
  "extractedData": {
    "skills": {
      "tools": ["AWS"]
    }
  }
}
```

### 4.2 The Vault Expansion Endpoint
**`POST /api/protected/ai/expand-vault`**

**Purpose:** Replaces the old `generate-bullets` endpoint. When a user provides a raw description of a project, this endpoint generates the exhaustive 10-12 `VaultBullet` array.

**Request:**
```json
{
  "type": "PROJECT",
  "title": "E-commerce App",
  "rawDescription": "Built it with Nextjs, used Stripe, deployed to Vercel."
}
```

**Response:**
```json
{
  "vaultBullets": [
    {
      "id": "uuid-1",
      "text": "Architected a scalable e-commerce storefront using Next.js, leveraging Server-Side Rendering (SSR) for optimal SEO and sub-second page loads.",
      "category": "FRONTEND",
      "keywords": ["Next.js", "SSR", "SEO"]
    },
    {
      "id": "uuid-2",
      "text": "Integrated Stripe payment gateway for secure, PCI-compliant transaction processing and subscription management.",
      "category": "BACKEND",
      "keywords": ["Stripe", "Payments", "Security"]
    }
  ]
}
```

### 4.3 The Tailoring Selection Endpoint
**`POST /api/protected/ai/select-bullets`**

**Purpose:** The engine for the Left Panel checklist. Matches Vault Bullets against a JD.

**Request:**
```json
{
  "jobDescription": "Looking for a React developer with strong AWS experience.",
  "profile": { /* Full Profile Object with all Vault Bullets */ }
}
```

**Response:**
```json
{
  "selections": {
    "project_id_1": ["uuid-1", "uuid-5", "uuid-12"], // The 3 selected bullet IDs
    "experience_id_1": ["uuid-8", "uuid-9", "uuid-11"]
  },
  "rationale": "Selected bullets heavily emphasizing React, frontend architecture, and AWS deployments."
}
```

---

## 5. AI SERVICE LAYER & PROMPT ENGINEERING

The `OpenCodeZenAIService` in `backend/src/infrastructure/ai/index.ts` must be utilized with highly engineered prompts.

### 5.1 Prompt: Intent Parser (Natural Language Navigation)
```text
System Prompt:
You are the routing brain of a Resume Builder Application called Resumint. 
Your goal is to parse the user's latest message and determine their INTENT.
The user is currently in phase: {{currentState.phase}}.

Possible Intents:
1. "PROVIDE_DATA": The user is giving you information (e.g., "I worked at Google as a dev").
2. "NAVIGATE": The user wants to change screens or go back (e.g., "Let's fix my skills", "Go back to projects").
3. "GENERAL_CHAT": Small talk or questions.

You MUST respond in strictly valid JSON format matching this schema:
{
  "intent": "PROVIDE_DATA" | "NAVIGATE" | "GENERAL_CHAT",
  "targetWidget": "CONTACT" | "EXPERIENCE" | "PROJECTS" | "SKILLS" | "CERTIFICATES" | "REVIEW" | null,
  "reply": "Conversational response to the user",
  "extractedData": { ... any data you managed to parse from their message }
}

Few-Shot Examples:
User: "I want to alter my projects"
Assistant: { "intent": "NAVIGATE", "targetWidget": "PROJECTS", "reply": "Sure! I've opened your projects checklist below.", "extractedData": {} }

User: "Add this AWS Certified Developer cert: https://aws.amazon.com/verify/123"
Assistant: { "intent": "PROVIDE_DATA", "targetWidget": "CERTIFICATES", "reply": "Got it, I've saved your AWS Certificate.", "extractedData": { "certificates": [{ "name": "AWS Certified Developer", "url": "https://aws.amazon.com/verify/123" }] } }
```

### 5.2 Prompt: The 12-Bullet Vault Expander
```text
System Prompt:
You are an expert technical resume writer. The user will provide a brief description of a project or job.
Your task is to generate EXACTLY 12 highly professional, impactful resume bullet points for this single item.

Crucial Instructions:
- Do not repeat yourself. Each bullet must focus on a DIFFERENT aspect.
- 3 bullets on Frontend/UI/UX.
- 3 bullets on Backend/Database/Architecture.
- 3 bullets on DevOps/Cloud/Testing/Security.
- 3 bullets on Leadership/Agile/Business Impact/Metrics.
- Start every bullet with a strong action verb (e.g., Architected, Spearheaded, Optimized).
- Quantify wherever possible (even if you have to use placeholders like 'X%').

Return valid JSON:
{
  "vaultBullets": [
    {
      "id": "<generate a random string id>",
      "text": "<bullet text>",
      "category": "<category>",
      "keywords": ["<kw1>", "<kw2>"]
    }
  ]
}
```

---

## 6. FRONTEND STATE MANAGEMENT (ZUSTAND & CONTEXT)

Because of the critical requirement for "Strict Synchronization" between the Left Panel (Chat/Checklist) and the Right Panel (Live PDF), React `useState` prop-drilling will fail catastrophically. We MUST implement a global store for the Builder phase.

### 6.1 `src/store/useBuilderStore.ts`
We will use Zustand (lightweight, unopinionated, perfect for Next.js).

```typescript
import { create } from 'zustand';
import { Profile, TailoredResumeState } from '@/core/domain/entities';

interface BuilderStore {
  // Data
  profile: Profile | null;
  jobDescription: string;
  
  // The crucial mapping of { ItemID: [BulletID, BulletID, BulletID] }
  selectedBulletIds: Record<string, string[]>;
  
  // PDF Rendering State
  isCompiling: boolean;
  pdfUrl: string | null;
  
  // Actions
  setProfile: (profile: Profile) => void;
  setJobDescription: (jd: string) => void;
  
  // Toggling a bullet instantly updates the store
  toggleBullet: (itemId: string, bulletId: string) => void;
  
  // Overrides AI selection with manual choice
  setSelections: (selections: Record<string, string[]>) => void;
  
  // Trigger PDF Compile
  triggerCompile: () => Promise<void>;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  profile: null,
  jobDescription: '',
  selectedBulletIds: {},
  isCompiling: false,
  pdfUrl: null,
  
  setProfile: (profile) => set({ profile }),
  setJobDescription: (jd) => set({ jobDescription: jd }),
  
  toggleBullet: (itemId, bulletId) => set((state) => {
    const currentList = state.selectedBulletIds[itemId] || [];
    const exists = currentList.includes(bulletId);
    let newList;
    if (exists) {
      newList = currentList.filter(id => id !== bulletId);
    } else {
      newList = [...currentList, bulletId];
    }
    
    // Auto-trigger compile after state update (handled in a useEffect in the component to avoid side-effects in reducer)
    return {
      selectedBulletIds: { ...state.selectedBulletIds, [itemId]: newList }
    };
  }),
  
  setSelections: (selections) => set({ selectedBulletIds: selections }),
  
  triggerCompile: async () => {
    // Implementation of the debounce compile call
  }
}));
```

---

## 7. FRONTEND COMPONENT ARCHITECTURE & UI DESIGN

The UI will heavily utilize the existing `globals.css` design tokens: `--surface`, `--card`, `--brand`, and the `.glass` class for premium aesthetics.

### 7.1 Chat Container (`src/components/chat/ChatContainer.tsx`)
This is the heart of both Onboarding and the Builder's Left Panel.

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

export function ChatContainer({ mode }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text) => {
    // Optimistic UI update
    const newMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/protected/chat/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMsg], mode })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        widget: data.targetWidget
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <div className="text-content-muted text-sm animate-pulse">Assistant is typing...</div>}
      </div>
      <div className="p-4 bg-card/80 backdrop-blur border-t border-edge">
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
```

### 7.2 Message Bubble (`src/components/chat/MessageBubble.tsx`)
Must support rendering custom UI Widgets inside the chat flow.

```tsx
import { FileUploadWidget } from './widgets/FileUploadWidget';
import { ProjectsVaultWidget } from './widgets/ProjectsVaultWidget';

export function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-up`}>
      <div className={`max-w-[85%] rounded-[var(--radius-xl)] p-4 ${
        isUser 
          ? 'bg-brand text-brand-fg shadow-[var(--shadow-md)] rounded-br-sm' 
          : 'bg-card border border-edge shadow-[var(--shadow-sm)] rounded-bl-sm'
      }`}>
        {message.content && <p className="text-sm prose-resumint whitespace-pre-wrap">{message.content}</p>}
        
        {/* Dynamic Widget Injection */}
        {message.widget === 'UPLOAD_DROPZONE' && <FileUploadWidget />}
        {message.widget === 'PROJECTS' && <ProjectsVaultWidget />}
      </div>
    </div>
  );
}
```

### 7.3 The Vault Checklist Widget (`src/components/builder/TailoringChecklistWidget.tsx`)
This widget appears inside the chat when the user is tailoring a resume.

```tsx
import { useBuilderStore } from '@/store/useBuilderStore';

export function TailoringChecklistWidget({ projectId }) {
  const profile = useBuilderStore(state => state.profile);
  const selectedIds = useBuilderStore(state => state.selectedBulletIds[projectId] || []);
  const toggleBullet = useBuilderStore(state => state.toggleBullet);
  
  const project = profile?.projects.find(p => p.id === projectId);
  if (!project) return null;
  
  return (
    <div className="mt-4 border border-edge rounded-lg bg-surface-subtle p-3 transition-colors duration-200">
      <h4 className="font-semibold text-sm mb-2 text-content">{project.title}</h4>
      <div className="space-y-2">
        {project.vaultBullets.map(bullet => {
          const isSelected = selectedIds.includes(bullet.id);
          return (
            <label key={bullet.id} className="flex items-start gap-2 cursor-pointer group p-1 rounded hover:bg-muted-bg transition-colors">
              <input 
                type="checkbox" 
                className="mt-1 accent-brand h-4 w-4 rounded border-edge-strong transition-all"
                checked={isSelected}
                onChange={() => toggleBullet(projectId, bullet.id)}
              />
              <span className={`text-sm leading-relaxed transition-colors ${isSelected ? 'text-content font-medium' : 'text-content-muted group-hover:text-content'}`}>
                {bullet.text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 8. NATURAL LANGUAGE NAVIGATION & INTENT PARSING

The user explicitly requested: *"If the person is on the skills part and has to go back to the project part, he just has to type in the chat area, for example, 'I want to alter my projects' and then the chat will send it back to the project checklist."*

### 8.1 The State Machine
The frontend `src/app/onboarding/page.tsx` will maintain an internal state machine, replacing the linear `step` variable.

```typescript
type OnboardingPhase = 
  | 'GREETING'
  | 'AWAITING_RESUME_OR_TEXT'
  | 'PROCESSING_UPLOAD'
  | 'REVIEW_EXPERIENCE'
  | 'REVIEW_PROJECTS'
  | 'REVIEW_SKILLS'
  | 'REVIEW_CONTACT_AND_CERTS'
  | 'COMPLETE';

const [currentPhase, setCurrentPhase] = useState<OnboardingPhase>('GREETING');
```

### 8.2 The Execution Flow
1. User is in `REVIEW_SKILLS` phase. The chat shows the Skills input widget.
2. User types: *"Actually, I forgot to add a project."*
3. Frontend sends `{ message: "...", currentPhase: "REVIEW_SKILLS" }` to `/api/protected/chat/interact`.
4. The AI Prompt analyzes this. It recognizes the intent is NOT providing a skill, but navigating backward.
5. AI returns: `{ "intent": "NAVIGATE", "targetWidget": "PROJECTS", "reply": "No problem, let's go back and add that project." }`
6. Frontend receives response.
7. Frontend updates state: `setCurrentPhase('REVIEW_PROJECTS')`.
8. Frontend appends the AI's reply to the chat array, including `widget: 'PROJECTS'`.
9. The chat UI seamlessly renders the Projects widget below the user's message. 
10. The user experiences flawless natural language navigation.

---

## 9. THE BUILDER: SPLIT-SCREEN CHAT & LIVE PDF PREVIEW

### 9.1 Layout Structure (`src/app/tailor/builder/page.tsx`)
This page requires maximum horizontal space. We may need to hide the standard `Sidebar` or collapse it.

```tsx
import { ChatContainer } from '@/components/chat/ChatContainer';
import { LivePdfRenderer } from '@/components/builder/LivePdfRenderer';

export default function BuilderPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      {/* LEFT PANEL: 35% Width - The Chat & Checklist Interface */}
      <div className="w-[35%] h-full border-r border-edge flex flex-col bg-card relative z-10 shadow-[var(--shadow-xl)]">
        {/* Header */}
        <div className="h-14 border-b border-edge flex items-center px-4 shrink-0 bg-surface-subtle">
          <h2 className="font-display font-semibold text-sm text-content flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Resumint AI Tailoring
          </h2>
        </div>
        
        {/* The Chat Interface component mapped here */}
        <div className="flex-1 overflow-hidden">
          <ChatContainer mode="BUILDER" />
        </div>
      </div>
      
      {/* RIGHT PANEL: 65% Width - Live PDF Preview */}
      <div className="w-[65%] h-full bg-muted-bg relative flex flex-col">
        {/* PDF Controls (Zoom, Download) */}
        <div className="h-14 border-b border-edge bg-card flex items-center justify-end px-4 gap-2 shrink-0">
          <Button variant="secondary" icon={<MagnifyingGlassPlus />}>Zoom In</Button>
          <Button variant="primary" icon={<DownloadSimple />}>Export PDF</Button>
        </div>
        
        {/* PDF Viewer Canvas */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start">
          <LivePdfRenderer />
        </div>
      </div>
    </div>
  );
}
```

### 9.2 The `LivePdfRenderer` Component
This component listens to `useBuilderStore`. Whenever `selectedBulletIds` changes, it debounces for 800ms, then triggers a re-compile.

```tsx
import { useEffect, useState } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';

export function LivePdfRenderer() {
  const selectedBulletIds = useBuilderStore(state => state.selectedBulletIds);
  const profile = useBuilderStore(state => state.profile);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    // Only compile if we have a profile and selections
    if (!profile) return;
    
    const compileTimer = setTimeout(async () => {
      setIsCompiling(true);
      try {
        const res = await fetch('/api/protected/resume/compile-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, selectedBulletIds })
        });
        
        if (!res.ok) throw new Error("Compilation failed");
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCompiling(false);
      }
    }, 800); // 800ms debounce prevents spamming pdflatex on rapid checkbox clicks

    return () => clearTimeout(compileTimer);
  }, [selectedBulletIds, profile]);

  return (
    <div className="relative w-full max-w-[800px] bg-white shadow-[var(--shadow-xl)] aspect-[1/1.414] transition-all duration-300">
      {isCompiling && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-opacity duration-300">
          <div className="bg-card px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <span className="text-sm font-medium">Re-rendering PDF...</span>
          </div>
        </div>
      )}
      {pdfUrl ? (
        <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full border-none" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-content-muted">
          Waiting for data to render...
        </div>
      )}
    </div>
  );
}
```

---

## 10. LATEX COMPILATION & RENDER PIPELINE

The existing `backend/src/infrastructure/latex/latex-template.ts` must be fundamentally altered to accept the `selectedBulletIds` mapping.

### 10.1 Dynamic Filtering in the LaTeX Engine
Instead of mapping over every bullet in the database, the engine must filter:

```typescript
// backend/src/infrastructure/latex/latex-template.ts

export function generateLatexSource(profile: Profile, selectedIds: Record<string, string[]>): string {
  let latex = `\\documentclass[letterpaper,11pt]{article}\n`;
  // ... LaTeX preamble imports ...

  // Experience Section
  if (profile.experience && profile.experience.length > 0) {
    latex += `\\section*{Experience}\n`;
    
    for (const exp of profile.experience) {
      // ONLY process this experience if it has selected bullets, OR if we force inclusion
      const activeBulletIds = selectedIds[exp.id] || [];
      if (activeBulletIds.length === 0) continue; // Skip experience if no bullets selected
      
      latex += `\\textbf{${escapeLatex(exp.role)}} \\hfill ${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)} \\\\\n`;
      latex += `\\textit{${escapeLatex(exp.company)}}\n`;
      latex += `\\begin{itemize}[noitemsep,topsep=0pt,parsep=0pt,partopsep=0pt]\n`;
      
      // Filter vaultBullets against the active list
      const bulletsToRender = exp.vaultBullets.filter(b => activeBulletIds.includes(b.id));
      
      for (const bullet of bulletsToRender) {
        latex += `  \\item ${escapeLatex(bullet.text)}\n`;
      }
      latex += `\\end{itemize}\n\\vspace{2mm}\n`;
    }
  }
  
  // Certificates Section (Handling Hyperlinks)
  if (profile.certificates && profile.certificates.length > 0) {
    latex += `\\section*{Certifications}\n`;
    latex += `\\begin{itemize}[noitemsep,topsep=0pt,parsep=0pt,partopsep=0pt]\n`;
    for (const cert of profile.certificates) {
      // Using \href{url}{text} from the hyperref package
      latex += `  \\item \\href{${cert.url}}{${escapeLatex(cert.name)}} - ${escapeLatex(cert.issuer)}\n`;
    }
    latex += `\\end{itemize}\n`;
  }

  return latex;
}
```

---

## 11. GRANULAR STEP-BY-STEP IMPLEMENTATION ROADMAP

We will execute this pivot in 6 highly controlled phases. No phase begins until the previous is verified.

### Phase 1: Database & Entity Realignment (The Vault Types)
**Goal:** Shift from string arrays to `VaultBullet` objects without Prisma migrations.
1.  Open `backend/src/core/domain/entities.ts`.
2.  Define `VaultBullet` interface.
3.  Modify `ExperienceItem` and `ProjectItem` to replace `bullets: string[]` with `vaultBullets: VaultBullet[]`.
4.  Add `certificates?: Certificate[]` to `Profile`.
5.  Open `backend/src/infrastructure/persistence/profile-repository.ts` and ensure `toJson()` correctly serializes the new object arrays.

### Phase 2: AI Intent & Vault Expansion Infrastructure
**Goal:** Build the backend brains for the Chat UI.
1.  Open `backend/src/infrastructure/ai/index.ts`.
2.  Create method `parseChatIntent(messages, state)` implementing the prompt from Section 5.1.
3.  Create method `expandVaultBullets(description)` implementing the 12-bullet expansion prompt from Section 5.2.
4.  Create method `selectBulletsForJD(vault, jd)` implementing the matching logic.
5.  Open `backend/src/index.ts` and expose these as new `/api/protected/chat/*` routes.

### Phase 3: Global State & Store Setup
**Goal:** Establish the Zustand nervous system.
1.  Create `src/store/useBuilderStore.ts`.
2.  Implement the store exactly as defined in Section 6.1.
3.  Ensure actions `toggleBullet`, `setProfile`, and `setJobDescription` are robust and typed.

### Phase 4: Frontend Component Library (Chat Widgets)
**Goal:** Build the visual building blocks.
1.  Create `src/components/chat/ChatContainer.tsx` with dynamic scroll-to-bottom logic.
2.  Create `src/components/chat/MessageBubble.tsx`.
3.  Create the Data Ingestion Widgets:
    *   `ResumeUploadWidget.tsx` (Drag & drop PDF).
    *   `ProfileReviewWidget.tsx` (Lists Vault bullets with edit/delete buttons).
    *   `CertificatesInputWidget.tsx` (Specifically handles URLs).
4.  Create the Tailoring Widgets:
    *   `TailoringChecklistWidget.tsx` (Connects directly to `useBuilderStore` to toggle IDs).

### Phase 5: The Mandatory Onboarding Lockdown
**Goal:** Replace the old wizard with the conversational AI flow.
1.  Open `src/app/onboarding/page.tsx`.
2.  Delete the existing `<UploadStep>`, `<ExperienceStep>`, etc.
3.  Mount `<ChatContainer mode="ONBOARDING" />`.
4.  Implement the State Machine (`OnboardingPhase`) locally or via a specialized Zustand store.
5.  Wire the chat input to the `/api/protected/chat/interact` endpoint.
6.  Ensure Next.js middleware (`src/middleware.ts` or layout logic) forces redirects to `/onboarding` if `profile.isComplete === false`.

### Phase 6: The Split-Screen Builder & Live PDF
**Goal:** The final magical UX.
1.  Create `src/app/tailor/builder/page.tsx` with the 35% / 65% split layout.
2.  Mount `<ChatContainer mode="BUILDER" />` in the left panel.
3.  Create `src/components/builder/LivePdfRenderer.tsx` and mount it in the right panel.
4.  Open `backend/src/infrastructure/latex/latex-template.ts` and implement the filtering logic from Section 10.1.
5.  Create `/api/protected/resume/compile-live` to handle the debounced rapid compilation requests.

---

## 12. EDGE CASES, ERROR HANDLING & RECOVERY

1.  **AI Hallucination on Intent Parsing:**
    *   *Risk:* The AI returns an invalid JSON or hallucinates a `targetWidget` that doesn't exist.
    *   *Mitigation:* The backend MUST wrap the DeepSeek call in a rigorous `try/catch` and use Zod schema validation on the response. If validation fails, return a fallback intent: `{ intent: "GENERAL_CHAT", reply: "I didn't quite catch that. Can you rephrase?", targetWidget: null }`.
2.  **PDF Compilation Failure:**
    *   *Risk:* LaTeX compilation fails due to a weird character in a user's Vault Bullet (e.g., an unescaped `&` or `%`).
    *   *Mitigation:* The `escapeLatex()` utility function must be utterly bulletproof. If `pdflatex` throws an error, the backend must catch it and return a 500 status with the error log. The `LivePdfRenderer` must display a beautiful Error UI overlay: *"Compile Error: Found invalid characters in your text."* instead of crashing the page.
3.  **Local Storage Backup:**
    *   *Risk:* User types a massive block of text, hits send, and the network drops.
    *   *Mitigation:* The chat input component should save drafts to `localStorage` on every keystroke, clearing only upon a successful 200 OK from the API.

---

**END OF MASTER SPECIFICATION.** 

---

## 13. EXECUTION PLAN — PHASED IMPLEMENTATION (2026-06-24)

### Phase 1: Database & Entity Realignment
**Status:** ✅ COMPLETE (2026-06-24)

**Steps executed:**
1. Updated `backend/src/core/domain/entities.ts` — added `VaultBullet`, `Certificate` interfaces; replaced `bullets: string[]` with `vaultBullets: VaultBullet[]` on `Experience` and `Project`; added `certificates: Certificate[]` to `Profile`.
2. Updated `backend/src/infrastructure/validation/index.ts` — added vault bullet schemas, updated `parsedResumeSchema`, `tailorOutputSchema` to `vaultBullets: VaultBullet[]` + `certificates`.
3. Updated `backend/src/infrastructure/validation/chat-schemas.ts` (NEW) — added Zod schemas for chat intent, vault expansion, bullet selection.
4. Updated `backend/src/infrastructure/prompts/index.ts` — added `CHAT_INTENT_PARSER`, `VAULT_EXPANDER`, `BULLET_SELECTOR` prompts.
5. Verified no Prisma migration needed (JSON columns are schema-less).

### Phase 2: AI Intent & Vault Expansion Infrastructure
**Status:** ✅ COMPLETE (2026-06-24)

**Steps executed:**
1. Created `backend/src/core/application/ports/chat-types.ts` — shared types for chat interaction, intent parsing, vault expansion.
2. Created `backend/src/core/application/use-cases/chat-use-cases.ts` — `ChatUseCases` class with `parseIntent()`, `expandVault()`, `selectBullets()` methods.
3. Registered `ChatUseCases` in `backend/src/di/container.ts`.
4. Added chat routes to `backend/src/index.ts`:
   - `POST /api/protected/chat/interact`
   - `POST /api/protected/ai/expand-vault`
   - `POST /api/protected/ai/select-bullets`

### Phase 3: Global State & Store Setup
**Status:** ✅ COMPLETE (2026-06-24)

**Steps executed:**
1. Created `src/store/useBuilderStore.ts` — Zustand store for the split-screen builder with `selectedBulletIds`, `profile`, `jobDescription`, `isCompiling`, `pdfUrl`, `toggleBullet`, `setSelections`, `triggerCompile`.
2. Created `src/store/useChatStore.ts` — Zustand store for the chat interface with `messages`, `currentPhase`, `isTyping`, `sendMessage`, `clearChat`.

### Phase 4: Frontend Component Library (Chat Widgets)
**Status:** ✅ COMPLETE (2026-06-24)

**Steps executed:**
1. Created `src/components/chat/ChatContainer.tsx` — scroll-to-bottom, typing indicator, connects to `useChatStore`.
2. Created `src/components/chat/MessageBubble.tsx` — dynamic widget injection based on `message.widget`.
3. Created `src/components/chat/ChatInput.tsx` — localStorage draft persistence, enter-to-send, auto-resize.
4. Created `src/components/chat/widgets/ResumeUploadWidget.tsx` — drag & drop PDF upload with parsing.
5. Created `src/components/chat/widgets/TailoringChecklistWidget.tsx` — checkbox list connected to `useBuilderStore`.

### Phase 5: The Mandatory Onboarding Lockdown
**Status:** ✅ COMPLETE (2026-06-24)

**Steps executed:**
1. Rewrote `src/app/onboarding/page.tsx` — mounts `ChatContainer mode="ONBOARDING"` with AI greeting message, auto-saves profile on COMPLETE phase, sets `onboarding_complete` cookie.
2. Implemented `OnboardingPhase` state machine in `useChatStore` with `mapWidgetToPhase` utility.
3. Created `src/middleware.ts` — checks `onboarding_complete` cookie, redirects to `/onboarding` if not set.

### Phase 6: Split-Screen Builder & Live PDF
**Status:** ✅ COMPLETE (2026-06-24)

**Steps executed:**
1. Created `src/app/tailor/builder/layout.tsx` — minimal full-screen layout (no sidebar).
2. Created `src/app/tailor/builder/page.tsx` with 35%/65% split layout, loads profile on mount, Export PDF button.
3. Created `src/components/builder/LivePdfRenderer.tsx` with 800ms debounced compile, loading overlay, iframe PDF viewer.
4. Updated `backend/src/infrastructure/latex/latex-template.ts` for vault bullet filtering (Phase 1).
5. Created `POST /api/protected/resume/compile-live` route — filters vault bullets by selected IDs, generates LaTeX, compiles with pdflatex, returns PDF.

---

## 14. PROGRESS LOG

| Phase | Description | Started | Completed | Status |
|-------|-------------|---------|-----------|--------|
| 1 | Database & Entity Realignment | 2026-06-24 | 2026-06-24 | ✅ |
| 2 | AI Intent & Vault Expansion | 2026-06-24 | 2026-06-24 | ✅ |
| 3 | Zustand Store | 2026-06-24 | 2026-06-24 | ✅ |
| 4 | Chat Component Library | 2026-06-24 | 2026-06-24 | ✅ |
| 5 | Onboarding Lockdown | 2026-06-24 | 2026-06-24 | ✅ |
| 6 | Split-Screen Builder & Live PDF | 2026-06-24 | 2026-06-24 | ✅ |
