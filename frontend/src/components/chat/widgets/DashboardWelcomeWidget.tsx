'use client'

interface DashboardWelcomeWidgetProps {
  name: string
}

export function DashboardWelcomeWidget({ name }: DashboardWelcomeWidgetProps) {
  return (
    <div className="pb-2">
      <h2 className="font-display font-semibold text-2xl text-fg m-0 leading-[1.2] tracking-tight">
        Welcome back, <span className="gradient-text">{name}</span>
      </h2>
      <p className="text-content-muted text-[15px] mt-1">
        Here&apos;s your career vault overview. Your profile is looking strong.
      </p>
    </div>
  )
}
