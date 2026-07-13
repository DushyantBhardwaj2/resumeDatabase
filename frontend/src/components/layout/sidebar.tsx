'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/config/api-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { useIsActive } from '@/hooks/use-is-active'
import { Avatar } from '@/components/ui/avatar'
import {
  Sparkle,
  UserCircle,
  ClockCounterClockwise,
  Lightbulb,
  GearSix,
  SignOut,
  Sidebar as SidebarIcon,
  SquaresFour,
  FolderOpen
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
  { icon: SquaresFour, label: 'Home', href: '/dashboard' },
  { icon: FolderOpen, label: 'Career Vault', href: '/profile' },
  { icon: Sparkle, label: 'Tailor', href: '/tailor' },
  { icon: ClockCounterClockwise, label: 'History', href: '/history' },
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
        'flex items-center rounded-[var(--radius-md)] text-[15px] transition-colors duration-200 mb-2',
        collapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3',
        active
          ? 'bg-brand-light text-brand font-medium'
          : 'text-content-muted hover:bg-surface-subtle hover:text-content',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} weight={active ? 'bold' : 'regular'} className="shrink-0" aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export function Sidebar({ user, collapsed = false, onToggleCollapse }: SidebarProps) {
  const isActive = useIsActive()
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

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/'
  }

  const settingsHref = '/dashboard/settings'

  return (
    <div
      className={[
        'flex flex-col h-screen sticky top-0 overflow-y-auto transition-all duration-300 z-50',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      ].join(' ')}
      style={{
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* ── Top scrollable section ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Brand */}
        <div className={collapsed ? 'p-4 flex justify-center mb-4' : 'p-6 mb-4 flex items-center gap-3'}>
          {collapsed ? (
            <Link href="/dashboard" className="w-8 h-8 rounded-[var(--radius-sm)] bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center font-display font-bold text-white text-base shadow-[0_0_12px_rgba(22,163,74,0.3)]" title="ResumeMint">
              M
            </Link>
          ) : (
            <>
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center font-display font-bold text-white text-base shadow-[0_0_12px_rgba(22,163,74,0.3)] shrink-0">M</div>
              <Link
                href="/dashboard"
                className="font-display font-semibold text-[1.2rem] tracking-tight text-content"
              >
                ResumeMint
              </Link>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-4" aria-label="Main navigation">
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
          <div className="px-6 mt-8">
            <p className="text-[10px] font-semibold tracking-widest text-content-subtle uppercase mb-3">
              Recent Tailors
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
