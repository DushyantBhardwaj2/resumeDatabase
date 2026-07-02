'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { useLocalStorage } from '@/lib/use-local-storage'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    image?: string | null
  }
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar-collapsed', true)

  return (
    <div className="flex min-h-[100dvh] bg-bg text-fg">
      {/* Desktop sidebar */}
      <div
        className={[
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-40 transition-all duration-300',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
        ].join(' ')}
      >
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile nav (header bar + drawer) */}
      <MobileNav user={user} />

      {/* Main content */}
      <main
        className={[
          'flex-1 min-h-[100dvh] transition-all duration-300 relative z-10',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]',
        ].join(' ')}
      >
        {/* pt-14 accounts for fixed mobile header; removed on desktop */}
        <div className="pt-14 lg:pt-0 h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
