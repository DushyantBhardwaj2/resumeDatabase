'use client'

import { UserCircle, ArrowUpRight, Clock, ChatCircleDots } from '@phosphor-icons/react'
import Link from 'next/link'

export function DashboardQuickActionsWidget() {
  const actions = [
    {
      label: 'Edit Profile',
      description: 'Update your details',
      icon: UserCircle,
      href: '/profile',
      variant: 'secondary' as const,
    },
    {
      label: 'Tailor Resume',
      description: 'AI tailors for any job',
      icon: ArrowUpRight,
      href: '/tailor',
      variant: 'primary' as const,
    },
    {
      label: 'History',
      description: 'Past tailored resumes',
      icon: Clock,
      href: '/history',
      variant: 'secondary' as const,
    },
    {
      label: 'Onboarding',
      description: 'Add more to vault',
      icon: ChatCircleDots,
      href: '/onboarding',
      variant: 'secondary' as const,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className={`flex items-center gap-2.5 p-3 rounded-[var(--radius-lg)] border transition-all ${
            a.variant === 'primary'
              ? 'bg-brand text-brand-fg border-brand hover:opacity-90'
              : 'bg-surface border-edge text-content hover:bg-muted-bg'
          }`}
        >
          <a.icon size={16} weight={a.variant === 'primary' ? 'bold' : 'regular'} />
          <div>
            <p className="text-xs font-medium leading-tight">{a.label}</p>
            <p className={`text-[10px] leading-tight mt-0.5 ${a.variant === 'primary' ? 'text-brand-fg/70' : 'text-content-muted'}`}>
              {a.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
