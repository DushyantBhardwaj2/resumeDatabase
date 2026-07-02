'use client'

import { Books, Briefcase, Folder, Code } from '@phosphor-icons/react'

interface DashboardStatsWidgetProps {
  education: number
  experience: number
  projects: number
  skills: number
}

export function DashboardStatsWidget({ education, experience, projects, skills }: DashboardStatsWidgetProps) {
  const stats = [
    { label: 'Education', value: education, icon: Books },
    { label: 'Experience', value: experience, icon: Briefcase },
    { label: 'Projects', value: projects, icon: Folder },
    { label: 'Skills', value: skills, icon: Code },
  ]

  return (
    <div className="glass card-lift h-full p-6 rounded-[var(--radius-xl)] flex flex-col">
      <h3 className="font-display text-base text-fg mb-6 font-semibold">Profile Vault</h3>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-brand-light text-brand flex items-center justify-center shrink-0">
              <s.icon size={20} />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-fg leading-none">{s.value}</div>
              <div className="text-xs text-content-muted mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
