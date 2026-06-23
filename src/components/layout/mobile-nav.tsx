'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar } from '@/components/ui/avatar'
import {
  List,
  X,
  House,
  Sparkle,
  UserCircle,
  ClockCounterClockwise,
  Files,
  Briefcase,
  Layout,
  ChartBar,
  ChartLineUp,
  GearSix,
  SignOut,
} from '@phosphor-icons/react'

interface MobileNavProps {
  user?: {
    name: string
    email: string
    image?: string
  }
}

type NavItemDef = {
  icon: React.ElementType
  label: string
  href: string
}

const activeNavItems: NavItemDef[] = [
  { icon: House, label: 'Home', href: '/dashboard' },
  { icon: Sparkle, label: 'Tailor', href: '/tailor' },
  { icon: UserCircle, label: 'Profile', href: '/dashboard/profile' },
  { icon: ClockCounterClockwise, label: 'History', href: '/history' },
]

const comingSoonNavItems: NavItemDef[] = [
  { icon: Files, label: 'Resumes', href: '/dashboard/resumes' },
  { icon: Briefcase, label: 'Roles', href: '/dashboard/roles' },
  { icon: Layout, label: 'Templates', href: '/dashboard/templates' },
  { icon: ChartBar, label: 'ATS Score', href: '/dashboard/ats-score' },
  { icon: ChartLineUp, label: 'Analytics', href: '/dashboard/analytics' },
]

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string): boolean {
    return pathname.startsWith(href)
  }

  function close() {
    setOpen(false)
  }

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="lg:hidden">
      {/* ── Fixed top bar ────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-edge flex items-center px-4 gap-3">
        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] text-content-muted hover:text-content hover:bg-surface transition-colors"
          aria-label="Open navigation menu"
        >
          <List size={20} aria-hidden="true" />
        </button>

        {/* Logo centered */}
        <span className="flex-1 text-center font-display font-bold text-content">
          resumint
        </span>

        {/* Theme toggle */}
        <ThemeToggle />
      </header>

      {/* ── Drawer overlay + panel ───────────────────────────────── */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-72 bg-card z-50 flex flex-col shadow-[var(--shadow-xl)] animate-slide-left">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-5 shrink-0">
              <Link
                href="/dashboard"
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

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto px-3" aria-label="Mobile navigation">
              {/* Workspace label */}
              <p className="text-[10px] font-semibold tracking-widest text-content-subtle uppercase px-2 mb-2">
                WORKSPACE
              </p>

              {/* Active nav items */}
              {activeNavItems.map((item) => {
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

              {/* Coming soon label */}
              <p className="mt-4 mb-2 px-2 text-[10px] font-semibold tracking-widest text-content-subtle uppercase">
                COMING SOON
              </p>

              {/* Coming soon items */}
              {comingSoonNavItems.map((item) => (
                <span
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm opacity-45 cursor-not-allowed select-none mb-0.5 text-content-muted"
                  aria-disabled="true"
                  role="link"
                  aria-label={`${item.label} — coming soon`}
                >
                  <item.icon size={18} weight="regular" aria-hidden="true" />
                  {item.label}
                  <span className="ml-auto text-[9px] font-medium bg-muted-bg text-content-subtle px-1.5 py-0.5 rounded-full leading-none">
                    soon
                  </span>
                </span>
              ))}
            </nav>

            {/* Bottom section */}
            <div className="border-t border-edge px-3 py-4 space-y-1 shrink-0">
              {/* Settings */}
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

              {/* Appearance row */}
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-content-muted">
                <span className="flex-1">Appearance</span>
                <ThemeToggle />
              </div>

              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 mt-1">
                  <Avatar size="sm" src={user.image} name={user.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content truncate">{user.name}</p>
                    <p className="text-xs text-content-subtle truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm text-content-muted hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer w-full text-left"
              >
                <SignOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MobileNav
