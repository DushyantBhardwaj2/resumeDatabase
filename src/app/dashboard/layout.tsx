import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardNav, MobileMenu } from "./nav"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary">
            Resumint
          </Link>
        </div>
        <DashboardNav />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <MobileMenu user={session.user} />
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full border border-border"
              />
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
