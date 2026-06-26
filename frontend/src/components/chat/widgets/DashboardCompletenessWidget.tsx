'use client'

interface DashboardCompletenessWidgetProps {
  percent: number
}

function getHint(pct: number): string {
  if (pct <= 25) return 'Add your education to get started.'
  if (pct <= 50) return 'Add work experience to strengthen your profile.'
  if (pct <= 75) return 'Add projects to showcase your work.'
  if (pct <= 99) return 'Add your skills to complete your profile.'
  return 'Your profile is complete. Ready to tailor!'
}

export function DashboardCompletenessWidget({ percent }: DashboardCompletenessWidgetProps) {
  return (
    <div className="mt-3 bg-surface border border-edge rounded-[var(--radius-lg)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-semibold text-sm text-content">Profile Completeness</span>
        <span className="text-brand font-mono text-sm font-bold">{percent}%</span>
      </div>
      <div className="h-2 bg-muted-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11px] text-content-subtle mt-2">{getHint(percent)}</p>
    </div>
  )
}
