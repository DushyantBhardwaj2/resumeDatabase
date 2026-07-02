'use client'

import { UserCircle, ArrowUpRight, Clock, ChatCircleDots } from '@phosphor-icons/react'
import Link from 'next/link'

export function DashboardQuickActionsWidget() {
  const actions = [
    {
      label: 'Update Vault',
      description: 'Add new experience',
      icon: UserCircle,
      href: '/profile',
    },
    {
      label: 'Tailor Resume',
      description: 'Match a job description',
      icon: ArrowUpRight,
      href: '/tailor',
    },
    {
      label: 'View History',
      description: 'Past versions',
      icon: Clock,
      href: '/history',
    },
    {
      label: 'Chat AI',
      description: 'Ask for career advice',
      icon: ChatCircleDots,
      href: '/onboarding',
    },
  ]

  return (
    <div>
      <h3 className="font-display text-base text-fg mb-3 font-semibold">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="glass card-lift p-4 rounded-[var(--radius-lg)] flex flex-col gap-3 group text-decoration-none"
          >
            <div className="w-8 h-8 rounded-full bg-surface border border-edge flex items-center justify-center text-content-muted group-hover:text-brand group-hover:border-brand/30 group-hover:bg-brand/5 transition-all">
              <a.icon size={16} />
            </div>
            <div>
              <div className="font-medium text-fg text-[14px] leading-tight mb-0.5">{a.label}</div>
              <div className="text-[11px] text-content-muted leading-tight">{a.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
