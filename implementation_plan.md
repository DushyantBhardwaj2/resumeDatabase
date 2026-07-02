# Implementation Plan: Animated UI Components (BorderGlow, AnimatedList, ChromaGrid)

## Overview

Add three animated UI components to `frontend/src/components/ui/` and integrate them into existing views. No new pages or routes — just component creation + surgical integration.

---

## 1. Dependencies

Install these packages in the `frontend` directory:

```powershell
# From frontend/
npm install motion
npm install gsap
```

| Package | Purpose | Size |
|---|---|---|
| `motion` | `AnimatedList` — staggered scroll-into-view animations via `motion.div` + `whileInView` | ~15 KB gzipped |
| `gsap` | `ChromaGrid` — per-item spotlight hover effect (GSAP `to` / `timeline`) | ~25 KB gzipped |

No additional type packages needed — `motion` ships its own types; `@types/gsap` is bundled with `gsap`.

---

## 2. New Components (3 files)

### 2a. `frontend/src/components/ui/border-glow.tsx`

**Dependencies:** None (pure CSS)

**Props:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `React.ReactNode` | required | Content to wrap |
| `animated` | `boolean` | `false` | Enable the rotating glow animation |
| `glowColor` | `string` | `'#16A34A'` | CSS color for the glow (brand emerald) |
| `className` | `string` | `''` | Additional classes |

**How it works:**
- Renders a container with `position: relative` + `border-radius`.
- A `::before` pseudo-element draws a conic gradient border using `glowColor` as the dominant stop.
- When `animated={true}`, a CSS `@keyframes rotate-glow` rotates the conic gradient by 360° over ~3s.
- The pseudo-element is clipped with `mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)` and `mask-composite: exclude` to only show the border area.
- `overflow: hidden` on the container prevents bleed.

**CSS to add to `globals.css`:**
```css
@keyframes rotate-glow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

**Code conventions followed:**
- `'use client'` at top
- ForwardRef not needed (pure presentational wrapper)
- Tailwind v4 semantic tokens for surface/edge colors
- `className` array `.join(' ')` pattern

### 2b. `frontend/src/components/ui/animated-list.tsx`

**Dependencies:** `motion`

**Props:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `T[]` | required | Array to render |
| `renderItem` | `(item: T, index: number) => React.ReactNode` | required | Render function per item |
| `className` | `string` | `''` | Wrapper classes |
| `delay` | `number` | `0.05` | Stagger delay between items (seconds) |

**How it works:**
- Renders a `<motion.div>` wrapper with `initial="hidden"` / `whileInView="visible"` / `viewport={{ once: true, margin: '-50px' }}`.
- Each child item is a `<motion.div>` with `variants` for staggered fade-up: `hidden={{ opacity: 0, y: 12 }}`, `visible={{ opacity: 1, y: 0 }}`.
- Stagger delay applied via `transition={{ staggerChildren: delay }}` on the parent.

### 2c. `frontend/src/components/ui/chroma-grid.tsx`

**Dependencies:** `gsap`

**Props:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `T[]` | required | Array to render |
| `renderItem` | `(item: T, index: number) => React.ReactNode` | required | Render function per item |
| `columns` | `number` | `3` | Grid columns |
| `className` | `string` | `''` | Wrapper classes |

**How it works:**
- Renders a CSS grid (`grid-cols-${columns}`) of item divs.
- On mount, a `useEffect` + `gsap.fromTo()` animates each item from `{ scale: 0.9, opacity: 0 }` to `{ scale: 1, opacity: 1 }` with stagger.
- A `mousemove` event listener on each item uses `gsap.to()` to create a spotlight effect: the item's `::before` gradient follows the cursor position by updating CSS custom properties `--x` and `--y`.
- On `mouseleave`, `gsap.to()` returns the gradient to center with a smooth ease.
- Cleanup: `gsap.killTweensOf()` in the return function.

---

## 3. Integration Changes (3 files)

### 3a. `MessageBubble.tsx` — Wrap AI messages with `<BorderGlow>`

**File:** `frontend/src/components/chat/MessageBubble.tsx`

**Change:**
- Import `BorderGlow`.
- In the assistant branch (non-user messages), wrap the content `<div>` in `<BorderGlow animated={true} glowColor="#16A34A">`.
- The user messages stay unchanged (no glow on the right side).
- Widget-based assistant messages (e.g., `DASHBOARD_WELCOME`, `UPLOAD_DROPZONE`) also get wrapped — the glow wraps the entire message card.

**No new props or interface changes.** Just an import + wrapper.

### 3b. `ProfileGenerationCard.tsx` — Animate bullet list with `<AnimatedList>`

**File:** `frontend/src/components/profile/ProfileGenerationCard.tsx`

**Change:**
- Import `AnimatedList`.
- Replace the `.map()` that renders `safeBullets` inside `showBullets && (...)` with `<AnimatedList items={safeBullets} renderItem={...} />`.
- Each bullet renders the same `<label>` element it does now (checkbox + text).
- Wrap the entire card in `<AnimatedList>` to stagger the full card content (including education/skills detail sections) or just the bullet region — I'll go with just the bullet region for precision.

### 3c. Dashboard / Templates — Display templates with `<ChromaGrid>`

**File:** `frontend/src/app/dashboard/templates/page.tsx`

**Change:**
- Import `ChromaGrid`.
- Create a static `TEMPLATES` array (client-side data) with entries like:
  ```ts
  { id: '1', name: 'Classic', description: 'Clean & traditional', icon: 'Layout' }
  ```
- Replace the "coming soon" placeholder text with a `<ChromaGrid items={TEMPLATES} renderItem={...} columns={3} />`.
- Each rendered item is a Card component (existing `frontend/src/components/ui/card.tsx`) with the template name and description.
- Keep the "Coming soon" badge at the top as a section header, but make the grid below it interactive.

**Alternative (safer):** If the templates page should remain "coming soon", add a "Previously Built Resumes" section to the dashboard page instead. Looking at the existing `dashboard-chat-client.tsx`, it's purely a chat container. A better approach is to add a secondary section below the chat — a `<section>` with heading "Previously Built Resumes" and a `<ChromaGrid>` showing mock resume entries (or fetched from the API). This gives an immediate visual payoff without blocking on template data.

---

## 4. globals.css Updates

Add to `frontend/src/app/globals.css`:

```css
@keyframes rotate-glow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

This is the only new keyframe needed.

---

## 5. Summary of All Changes

| Step | File | Action |
|---|---|---|
| A | `frontend/` | `npm install motion gsap` |
| B | `frontend/src/app/globals.css` | Add `@keyframes rotate-glow` |
| C | Create `frontend/src/components/ui/border-glow.tsx` | New component |
| D | Create `frontend/src/components/ui/animated-list.tsx` | New component |
| E | Create `frontend/src/components/ui/chroma-grid.tsx` | New component |
| F | `frontend/src/components/chat/MessageBubble.tsx` | Import + wrap AI messages with `<BorderGlow>` |
| G | `frontend/src/components/profile/ProfileGenerationCard.tsx` | Import + replace bullets `.map()` with `<AnimatedList>` |
| H | `frontend/src/app/dashboard/templates/page.tsx` OR `frontend/src/app/dashboard/dashboard-chat-client.tsx` | Import + add `<ChromaGrid>` with template/resume data |

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `motion` type conflicts with existing React 19 | `motion` supports React 19 — verified in docs |
| GSAP + React strict mode double-mount | Use `useRef` guard + cleanup `gsap.killTweensOf` in `useEffect` return |
| `BorderGlow` CSS mask not rendering on all browsers | `mask-composite: exclude` works in Chrome/Firefox/Safari 17+. Fallback: a solid static border if unsupported (detected via `@supports not (mask-composite: exclude)`). |
| Templates page is "coming soon" — maybe shouldn't be modified | Offer both options in plan and let you decide |
| Bundle size increase from gsap | GSAP is ~25 KB gzipped; tree-shaken since only `gsap.to`/`fromTo` used. Webpack will remove unused modules. |

---

*Review and approve this plan before I execute any code.*
