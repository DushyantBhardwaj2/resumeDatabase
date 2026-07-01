'use client'

import { useState, useEffect } from 'react'
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
    <div className="flex min-h-[100dvh] bg-surface">
      {/* Desktop sidebar */}
      <div
        className={[
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-30 transition-all duration-200',
          sidebarCollapsed ? 'lg:w-[56px]' : 'lg:w-[228px]',
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
          'flex-1 min-h-[100dvh] transition-all duration-200',
          sidebarCollapsed ? 'lg:pl-[56px]' : 'lg:pl-[228px]',
        ].join(' ')}
      >
        {/* pt-14 accounts for fixed mobile header; removed on desktop */}
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
