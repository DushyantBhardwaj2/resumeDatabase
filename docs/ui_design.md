# Resumint UI Design System

> **Version**: 1.0
> **Framework**: Tailwind CSS v4 (via `@tailwindcss/postcss`)
> **Theme**: `next-themes` with class strategy (`.light` / `.dark`)
> **Fonts**: Satoshi (headings), Inter (body), JetBrains Mono (code)

---

## 1. Tailwind v4 Theme Configuration

All tokens live in `src/app/globals.css` inside a `@theme inline {}` block:

```css
@import "tailwindcss";

@theme inline {
  /* ---- Core Colors ---- */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-primary-light: #a5b4fc;
  --color-accent: #06b6d4;
  --color-accent-dark: #0891b2;
  --color-accent-light: #67e8f9;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);

  /* ---- Typography ---- */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-heading: "Satoshi", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* ---- Border Radius ---- */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
}

:root, .light {
  --background: #ffffff;
  --foreground: #0f172a;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --border: #e2e8f0;
}

.dark {
  --background: #0a0a0f;
  --foreground: #f8fafc;
  --muted: #1e1e2a;
  --muted-foreground: #94a3b8;
  --card: #13131e;
  --card-foreground: #f8fafc;
  --border: #1e1e2a;
}
```

### Usage Notes

- **Primary** indigo is the main CTA/accent color. Use `bg-primary text-white` for buttons.
- **Accent** cyan is used for secondary highlights, badges, and decorative elements.
- **Muted** backgrounds for cards/secondary surfaces. **Muted-foreground** for secondary text.
- **Error** red for destructive actions and validation errors. **Success** green for confirmations.
- **Warning** amber for cautionary states (e.g. unsaved changes).

---

## 2. Font Configuration

Two fonts are loaded via `next/font/google` in `src/app/layout.tsx`:

- **Satoshi** (variable, weight 400–900) — used for headings via the `font-heading` CSS variable
- **Inter** (variable, weight 300–700) — used for body text via `font-sans`
- **JetBrains Mono** (variable, weight 400–700) — used for code/monospace via `font-mono`

The root `<html>` element applies:
```tsx
className={`${satoshi.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
```

Use the classes:
- `font-sans` — body text (Inter)
- `font-heading` — headings (Satoshi, heavier weight)
- `font-mono` — code (JetBrains Mono)

---

## 3. Base UI Components

### 3.1 Button

Location: `src/components/ui/button.tsx`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"primary"` | Style variant |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size preset |
| `loading` | `boolean` | `false` | Shows spinner, disables |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | `""` | Additional classes |
| `children` | `React.ReactNode` | — | Content |

**Variants**:
- **primary**: `bg-primary text-white hover:bg-primary-dark`
- **secondary**: `border border-border bg-card text-foreground hover:bg-muted`
- **ghost**: `text-muted-foreground hover:text-foreground hover:bg-muted`
- **danger**: `bg-error text-white hover:bg-red-600`

**Sizes**:
- **sm**: `h-8 px-3 text-xs rounded-full`
- **md**: `h-10 px-5 text-sm rounded-full`
- **lg**: `h-12 px-8 text-base rounded-full`

All buttons use the `.glass` class when appropriate for glassmorphism effect.

### 3.2 Input

Location: `src/components/ui/input.tsx`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Optional label text |
| `error` | `string` | — | Error message |
| `hint` | `string` | — | Helper text |
| `className` | `string` | `""` | Additional classes |
| Standard HTML input props | — | — | Passed through |

**Base styling**: `rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary`

**Error state**: `border-error focus:border-error`

**Disabled state**: `opacity-50 cursor-not-allowed`

Textarea uses the same styling with `resize-y`.

### 3.3 Badge

Location: `src/components/ui/badge.tsx`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "primary" \| "accent" \| "success" \| "warning" \| "error"` | `"default"` | Color variant |
| `size` | `"sm" \| "md"` | `"sm"` | Size |
| `className` | `string` | `""` | Additional classes |

**Base styling**: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

**Variants**:
- **default**: `bg-muted text-muted-foreground`
- **primary**: `bg-primary/10 text-primary`
- **accent**: `bg-accent/10 text-accent-dark`
- **success**: `bg-success/10 text-success`
- **warning**: `bg-warning/10 text-warning`
- **error**: `bg-error/10 text-error`

### 3.5 Avatar

Location: `src/components/ui/avatar.tsx`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string \| null \| undefined` | — | Image URL |
| `name` | `string` | — | Fallback initials (2 chars max) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size preset |

Renders `<img>` if `src` is provided, otherwise shows a colored circle with initials from `getInitials(name)`.

### 3.6 Dialog

Location: `src/components/ui/dialog.tsx`

A modal overlay with backdrop blur, close button, title, and description. Uses a controlled `open`/`onOpenChange` pattern. Contents are rendered in a centered card with `animate-scale-in`.

### 3.7 Progress

Location: `src/components/ui/progress.tsx`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0` | Progress percentage (0–100) |
| `max` | `number` | `100` | Maximum value |

Renders a horizontal bar with a fill indicator.

### 3.8 Separator

Location: `src/components/ui/separator.tsx`

A horizontal `<hr>` styled with `border-border`. Used between sections or list items.

### 3.9 Skeleton

Location: `src/components/ui/skeleton.tsx`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `""` | Width/height/shape classes |

Renders a pulsing placeholder (`animate-pulse rounded-md bg-muted`). Usage: `<Skeleton className="h-4 w-[200px]" />`.

### 3.10 Tooltip

Location: `src/components/ui/tooltip.tsx`

A simple CSS-based tooltip on hover. Wraps children and shows the tooltip text on hover via a `group` + `group-hover` pattern. No JavaScript dependency.

---

### 3.4 Card

Location: `src/components/ui/card.tsx`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "glass" \| "interactive"` | `"default"` | Style variant |
| `padding` | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Inner padding |
| `className` | `string` | `""` | Additional classes |
| `children` | `React.ReactNode` | — | Content |

**Variants**:
- **default**: `rounded-2xl border border-border bg-card shadow-sm`
- **glass**: `rounded-2xl glass shadow-sm` (uses `.glass` utility class)
- **interactive**: Same as default with `hover:shadow-md hover:border-primary/30 cursor-pointer transition-all`

**Padding**:
- **none**: `p-0`
- **sm**: `p-4`
- **md**: `p-6`
- **lg**: `p-8`

---

## 4. Glassmorphism

The `.glass` class provides a frosted-glass effect:

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.dark .glass {
  background: rgba(19, 19, 30, 0.7);
  border-color: rgba(30, 30, 42, 0.5);
}
```

Use on: modals, floating panels, nav bars, sidebar cards.

---

## 5. Animations

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in    { animation: fade-in 0.3s ease-out; }
.animate-slide-up   { animation: slide-up 0.4s ease-out; }
.animate-scale-in   { animation: scale-in 0.2s ease-out; }
```

**Staggered delays**: `.stagger-1` (50ms), `.stagger-2` (100ms), `.stagger-3` (150ms), `.stagger-4` (200ms)

---

## 6. Dark/Light Mode

- Managed by `next-themes` with `attribute="class"` and `defaultTheme="system"`
- Toggle via `<ThemeToggle />` component in `src/components/theme-toggle.tsx`
- Active class `.light` or `.dark` on `<html>`
- All design tokens defined per mode in CSS variables
- `transition: background-color 0.2s ease, color 0.2s ease` on `body`

---

## 7. Layout & Spacing

### 7.1 Layout Architecture

Three layout components in `src/components/layout/`:

- **`AppLayout`** — Wraps authenticated pages. Renders `Sidebar` (desktop, fixed 228px) + `MobileNav` (mobile header + slide-in drawer) + fluid `<main>` with `lg:pl-[228px]`.
- **`AuthLayout`** — Wraps auth pages (sign-in, redirect). Two-column split: left 55% form panel with logo + centered content, right 45% branded visual panel with mascot + tagline + feature chips (desktop only).
- **`MobileNav`** — Fixed top header (h-14) with hamburger, centered logo, theme toggle. Opens slide-in drawer (`animate-slide-left`) with same nav structure as sidebar.

### 7.2 Dashboard Navigation

**Sidebar sections**:
- **WORKSPACE**: Home (`/dashboard`), Tailor (`/tailor`), Profile (`/dashboard/profile`), History (`/history`)
- **COMING SOON** (disabled, `opacity-45`): Resumes, Roles, Templates, ATS Score, Analytics
- **Bottom strip**: Settings link, Appearance toggle (ThemeToggle), user avatar/name/email, Sign Out button

### 7.3 Spacing

- **Content max-width**: `max-w-4xl` (standard pages), `max-w-5xl` (wide pages like tailoring)
- **Page padding**: `p-4 lg:p-6` inside main, `px-6 py-12` for standalone pages
- **Section spacing**: `space-y-6` or `space-y-8` between major sections
- **Card grids**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`

---

## 8. Accessibility

- `:focus-visible` outline: `2px solid var(--color-primary)` with `outline-offset: 2px`
- `aria-label` on icon-only buttons
- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<button>`, `<label>`
- Color contrast: text on surfaces meets WCAG AA (4.5:1 ratio)
- Reduced motion: CSS respects `prefers-reduced-motion`

---

## 9. Custom Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
```

---

## 10. Toast Notifications

- Library: `sonner`
- Position: `top-right`
- Variant: `richColors` with `closeButton`
- Theme: `system` (follows dark/light mode)
- Usage: `toast.success("...")`, `toast.error("...")`, `toast.warning("...")`
