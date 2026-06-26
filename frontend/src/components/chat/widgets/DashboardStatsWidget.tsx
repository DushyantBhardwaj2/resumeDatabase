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
    { label: 'Education', value: education, icon: Books, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Experience', value: experience, icon: Briefcase, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Projects', value: projects, icon: Folder, color: 'text-violet-500 bg-violet-500/10' },
    { label: 'Skills', value: skills, icon: Code, color: 'text-emerald-500 bg-emerald-500/10' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface border border-edge rounded-[var(--radius-lg)] p-3 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 ${s.color}`}>
            <s.icon size={16} />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-content leading-none">{s.value}</p>
            <p className="text-[10px] text-content-muted mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
