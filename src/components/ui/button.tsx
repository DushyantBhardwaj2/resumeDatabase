'use client'

import * as React from 'react'
import { ArrowClockwise } from '@phosphor-icons/react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-fg hover:opacity-90 border border-transparent',
  secondary: 'bg-card text-content border border-edge hover:bg-surface',
  ghost: 'bg-transparent text-content hover:bg-surface border border-transparent',
  outline: 'bg-transparent text-content border border-edge hover:bg-surface',
  destructive: 'bg-red-500 text-white hover:bg-red-600 border border-transparent',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
  icon: 'h-9 w-9 p-0',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]',
          'transition-all duration-150 cursor-pointer select-none',
          'active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <ArrowClockwise
            size={size === 'sm' ? 13 : 15}
            className="animate-[spin_0.7s_linear_infinite] shrink-0"
            aria-hidden="true"
          />
        ) : (
          icon && (
            <span className="shrink-0 flex items-center" aria-hidden="true">
              {icon}
            </span>
          )
        )}

        {size !== 'icon' && children && (
          <span className={loading ? 'opacity-70' : ''}>{children}</span>
        )}

        {!loading && iconRight && size !== 'icon' && (
          <span className="shrink-0 flex items-center" aria-hidden="true">
            {iconRight}
          </span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
