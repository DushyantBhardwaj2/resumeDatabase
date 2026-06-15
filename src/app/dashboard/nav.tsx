"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems: Array<{
  label: string
  href: string
  disabled?: boolean
  icon: React.ReactNode
}> = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    label: "Tailor Resume",
    href: "/tailor",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    label: "History",
    href: "/history",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export function MobileMenu({ user }: { user: { name: string; image?: string | null } }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <span className="text-lg font-bold tracking-tight text-primary">Resumint</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-border bg-card p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              {user.image && (
                <img src={user.image} alt="" className="h-10 w-10 rounded-full border border-border" />
              )}
              <div>
                <p className="text-sm font-medium">{user.name}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <DashboardNav onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

export function DashboardNav({
  onClick,
}: {
  onClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col p-4">
      <ul className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              {item.disabled ? (
                <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50">
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
      <div className="border-t border-border pt-4">
        <form action="/api/auth/sign-out" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  )
}
