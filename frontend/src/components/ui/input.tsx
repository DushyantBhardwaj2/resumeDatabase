'use client'

import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, icon, id, className = '', ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content mb-1.5 leading-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-content-muted pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'h-9 w-full rounded-[var(--radius-md)] bg-card border text-sm text-content',
              'placeholder:text-content-subtle',
              'transition-colors duration-150',
              'outline-none',
              'focus:border-brand focus:ring-1 focus:ring-brand/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              hasError
                ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                : 'border-edge',
              icon ? 'pl-9 pr-3' : 'px-3',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            aria-invalid={hasError ? true : undefined}
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-500 mt-1 leading-snug"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-content-subtle mt-1 leading-snug"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
