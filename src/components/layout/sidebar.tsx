'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar } from '@/components/ui/avatar'
import {
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

interface SidebarProps {
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

function NavLink({
  icon: Icon,
  label,
  href,
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  href: string
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-150 mb-0.5',
        active
          ? 'bg-brand-light text-brand font-medium'
          : 'text-content-muted hover:bg-surface hover:text-content',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
      {label}
    </Link>
  )
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/'
  }

  const settingsHref = '/dashboard/settings'

  return (
    <div
      className="flex flex-col h-screen sticky top-0 overflow-y-auto w-[228px]"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* ── Top scrollable section ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-5">
          <Link
            href="/dashboard"
            className="font-display font-bold text-lg text-content inline-flex items-center"
          >
            resumint
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand ml-0.5 mb-1" aria-hidden="true" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-3 mt-2" aria-label="Main navigation">
          {/* Workspace section label */}
          <p className="text-[10px] font-semibold tracking-widest text-content-subtle uppercase px-2 mb-2">
            WORKSPACE
          </p>

          {/* Active nav items */}
          {activeNavItems.map((item) => (
            <NavLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
            />
          ))}

          {/* Coming soon section label */}
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
      </div>

      {/* ── Bottom section ──────────────────────────────────────── */}
      <div className="border-t border-edge px-3 py-4 space-y-1">
        {/* Settings */}
        <NavLink
          icon={GearSix}
          label="Settings"
          href={settingsHref}
          active={isActive(settingsHref)}
        />

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
  )
}

export default Sidebar
