'use client'

interface DashboardWelcomeWidgetProps {
  name: string
}

export function DashboardWelcomeWidget({ name }: DashboardWelcomeWidgetProps) {
  return (
    <div className="mt-2">
      <p className="text-content font-medium text-sm">
        Good to see you, <span className="text-brand font-semibold">{name}</span>!
      </p>
      <p className="text-content-muted text-xs mt-1">
        Here&apos;s your Career Vault overview. You can ask me anything or use the chat below to navigate.
      </p>
    </div>
  )
}
