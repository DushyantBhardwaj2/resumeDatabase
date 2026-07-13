'use client'

import { useState, useEffect, useRef, useCallback, startTransition } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { usePathname } from 'next/navigation'
import { useIsActive } from '@/hooks/use-is-active'
import { Avatar } from '@/components/ui/avatar'
import {
  List,
  X,
  Sparkle,
  UserCircle,
  ClockCounterClockwise,
  Lightbulb,
  GearSix,
  SignOut,
} from '@phosphor-icons/react'

interface MobileNavProps {
  user?: {
    name: string
    email: string
    image?: string | null
  }
}

type NavItemDef = {
  icon: React.ElementType
  label: string
  href: string
}

const navItems: NavItemDef[] = [
  { icon: Sparkle, label: 'Generate', href: '/tailor' },
  { icon: UserCircle, label: 'Profile Builder', href: '/profile' },
  { icon: ClockCounterClockwise, label: 'History', href: '/history' },
  { icon: Lightbulb, label: 'Tips', href: '/tips' },
]

function focusableSelector(): string {
  return 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector()))
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const isActive = useIsActive()
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setOpen(false), [])

  // Close drawer on route change
  useEffect(() => {
    startTransition(() => close())
  }, [pathname, close])

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  // Focus management: save on open, restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus first focusable element inside drawer on next frame (after render)
      requestAnimationFrame(() => {
        if (drawerRef.current) {
          const els = getFocusableElements(drawerRef.current)
          els[0]?.focus()
        }
      })
    } else {
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [open])

  // Focus trap: cycle Tab within drawer
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      close()
      return
    }

    if (e.key !== 'Tab' || !drawerRef.current) return

    const els = getFocusableElements(drawerRef.current)
    if (els.length === 0) return

    const first = els[0]
    const last = els[els.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [close])

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="lg:hidden">
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-edge flex items-center px-4 gap-3">
        <button
          ref={toggleRef}
          onClick={() => setOpen(true)}
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] text-content-muted hover:text-content hover:bg-surface transition-colors"
          aria-label="Open navigation menu"
          aria-expanded={open}
        >
          <List size={20} aria-hidden="true" />
        </button>

        <span className="flex-1 text-center font-display font-bold text-content">
          resumint
        </span>

        <ThemeToggle />
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div
            className="fixed inset-0 bg-black/40 animate-fade-in"
            onClick={close}
            aria-hidden="true"
          />

          <div
            ref={drawerRef}
            onKeyDown={handleKeyDown}
            className="fixed top-0 left-0 h-full w-72 bg-card z-50 flex flex-col shadow-[var(--shadow-xl)] animate-slide-left"
          >
            <div className="flex items-center justify-between px-5 py-5 shrink-0">
              <Link
                href="/tailor"
                onClick={close}
                className="font-display font-bold text-lg text-content inline-flex items-center"
              >
                resumint
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand ml-0.5 mb-1" aria-hidden="true" />
              </Link>

              <button
                onClick={close}
                className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] text-content-muted hover:text-content hover:bg-surface transition-colors"
                aria-label="Close navigation menu"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <p className="text-[11px] text-content-subtle px-5 pb-3 leading-tight">
              Your words, sharpened. Never made up.
            </p>

            <nav className="flex-1 overflow-y-auto px-3" aria-label="Main navigation">
              {navItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={[
                      'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-150 mb-0.5',
                      active
                        ? 'bg-brand-light text-brand font-medium'
                        : 'text-content-muted hover:bg-surface hover:text-content',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-edge px-3 py-4 space-y-1 shrink-0">
              {(() => {
                const settingsHref = '/dashboard/settings'
                const active = isActive(settingsHref)
                return (
                  <Link
                    href={settingsHref}
                    onClick={close}
                    className={[
                      'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-150 mb-0.5',
                      active
                        ? 'bg-brand-light text-brand font-medium'
                        : 'text-content-muted hover:bg-surface hover:text-content',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    <GearSix size={18} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                    Settings
                  </Link>
                )
              })()}

              <div className="flex items-center gap-3 px-3 py-2 text-sm text-content-muted">
                <span className="flex-1">Appearance</span>
                <ThemeToggle />
              </div>

              {user && (
                <div className="flex items-center gap-3 px-3 py-2 mt-1">
                  <Avatar size="sm" src={user.image} name={user.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content truncate">{user.name}</p>
                    <p className="text-xs text-content-subtle truncate">{user.email}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleSignOut}
                type="button"
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm text-content-muted hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer w-full text-left"
              >
                <SignOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileNav
