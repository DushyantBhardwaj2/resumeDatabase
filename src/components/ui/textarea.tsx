'use client'

import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  rows?: number
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, rows = 4, id, className = '', ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = id ?? generatedId
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-content mb-1.5 leading-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={[
            'w-full min-h-[90px] rounded-[var(--radius-md)] bg-card border text-sm text-content',
            'placeholder:text-content-subtle',
            'px-3 py-2',
            'resize-y',
            'transition-colors duration-150',
            'outline-none',
            'focus:border-brand focus:ring-1 focus:ring-brand/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError
              ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
              : 'border-edge',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          aria-invalid={hasError ? true : undefined}
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-red-500 mt-1 leading-snug"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${textareaId}-helper`}
            className="text-xs text-content-subtle mt-1 leading-snug"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
