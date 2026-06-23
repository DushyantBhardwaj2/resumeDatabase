import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    image?: string
  }
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-[228px] lg:fixed lg:inset-y-0 lg:left-0 z-30">
        <Sidebar user={user} />
      </div>

      {/* Mobile nav (header bar + drawer) */}
      <MobileNav user={user} />

      {/* Main content */}
      <main className="flex-1 lg:pl-[228px] min-h-[100dvh]">
        {/* pt-14 accounts for fixed mobile header; removed on desktop */}
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
