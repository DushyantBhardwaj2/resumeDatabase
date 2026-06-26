import * as React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'outline'
type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-muted-bg text-content-muted border border-edge',
  success:
    'bg-brand-light text-brand border border-brand/20',
  warning:
    'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  error:
    'bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200 dark:border-red-900',
  outline:
    'bg-transparent text-content-muted border border-edge',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'rounded-full font-medium inline-flex items-center gap-1',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && (
        <span className="shrink-0 flex items-center" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
