'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/config/api-client'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar } from '@/components/ui/avatar'
import {
  Sparkle,
  UserCircle,
  ClockCounterClockwise,
  Lightbulb,
  GearSix,
  SignOut,
  Sidebar as SidebarIcon,
} from '@phosphor-icons/react'
interface SidebarProps {
  user?: {
    name: string
    email: string
    image?: string | null
  }
  collapsed?: boolean
  onToggleCollapse?: () => void
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

type HistoryItem = {
  id: string
  jobTitle: string
  companyName: string
  createdAt: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function NavLink({
  icon: Icon,
  label,
  href,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ElementType
  label: string
  href: string
  active: boolean
  collapsed?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center rounded-[var(--radius-md)] text-sm transition-colors duration-150 mb-0.5',
        collapsed ? 'justify-center py-2 px-0' : 'gap-3 px-3 py-2',
        active
          ? 'bg-brand-light text-brand font-medium'
          : 'text-content-muted hover:bg-surface hover:text-content',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} weight={active ? 'fill' : 'regular'} className="shrink-0" aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export function Sidebar({ user, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.api.protected.history.$get()
        if (res.ok) {
          const data: HistoryItem[] = await res.json()
          setHistoryItems(data.slice(0, 5))
        }
      } catch { /* ignore */ }
      setHistoryLoading(false)
    })()
  }, [])

  function isActive(href: string): boolean {
    if (href === '/tailor' && pathname.startsWith('/tailor')) return true
    return pathname.startsWith(href) && href !== '/tailor'
  }

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/'
  }

  const settingsHref = '/dashboard/settings'

  return (
    <div
      className={[
        'flex flex-col h-screen sticky top-0 overflow-y-auto transition-all duration-200',
        collapsed ? 'w-[56px]' : 'w-[228px]',
      ].join(' ')}
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* ── Top scrollable section ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Brand */}
        <div className={collapsed ? 'px-3 pt-5 pb-3 flex justify-center' : 'px-5 pt-5 pb-3'}>
          {collapsed ? (
            <Link href="/tailor" className="font-display font-bold text-lg text-content" title="resumint">
              R
            </Link>
          ) : (
            <Link
              href="/tailor"
              className="font-display font-bold text-lg text-content inline-flex items-center"
            >
              resumint
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand ml-0.5 mb-1" aria-hidden="true" />
            </Link>
          )}
          {!collapsed && (
            <p className="text-[11px] text-content-subtle mt-1 leading-tight">
              Your words, sharpened. Never made up.
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-3 mt-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Previously Built — hide when collapsed */}
        {!collapsed && (
          <div className="px-5 mt-5">
            <p className="text-[10px] font-semibold tracking-widest text-content-subtle uppercase mb-2">
              Previously Built
            </p>
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-muted-bg rounded-[var(--radius-md)] animate-pulse" />
                ))}
              </div>
            ) : historyItems.length > 0 ? (
              <div className="space-y-0.5">
                {historyItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tailor?clone=${item.id}`}
                    className="block px-2 py-1.5 rounded-[var(--radius-md)] text-xs text-content-muted hover:bg-surface hover:text-content transition-colors truncate"
                  >
                    <span className="font-medium">{item.jobTitle}</span>
                    <span className="text-content-subtle ml-1">— {item.companyName}</span>
                    <span className="text-content-subtle ml-1 font-mono text-[10px]">{formatDate(item.createdAt)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-content-subtle px-2">No resumes built yet.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom section ──────────────────────────────────────── */}
      <div className="border-t border-edge px-3 py-4 space-y-1">
        <button
          onClick={onToggleCollapse}
          className={[
            'flex items-center w-full rounded-[var(--radius-md)] text-sm text-content-muted hover:bg-surface hover:text-content transition-colors mb-1',
            collapsed ? 'justify-center py-2 px-0' : 'gap-3 px-3 py-2'
          ].join(' ')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <SidebarIcon size={18} className="shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Collapse</span>}
        </button>

        <NavLink
          icon={GearSix}
          label="Settings"
          href={settingsHref}
          active={isActive(settingsHref)}
          collapsed={collapsed}
        />

        {collapsed ? (
          <div className="flex justify-center py-2" title="Toggle Theme">
            <ThemeToggle size={18} className="shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-content-muted">
            <span className="flex-1">Appearance</span>
            <ThemeToggle />
          </div>
        )}

        {user && (
          <div
            className={collapsed ? "flex justify-center py-2" : "flex items-center gap-3 px-3 py-2 mt-1"}
            title={collapsed ? `${user.name} (${user.email})` : undefined}
          >
            <Avatar size="sm" src={user.image} name={user.name} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content truncate">{user.name}</p>
                <p className="text-xs text-content-subtle truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={[
            'flex items-center rounded-[var(--radius-md)] text-sm text-content-muted hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors cursor-pointer w-full text-left',
            collapsed ? 'justify-center py-2 px-0' : 'gap-3 px-3 py-2'
          ].join(' ')}
        >
          <SignOut size={18} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
