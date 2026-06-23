'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { XCircle } from '@phosphor-icons/react'

type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: DialogSize
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  // Prevent body scroll when open
  React.useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Escape key handler
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null
  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div
        className={[
          'bg-card rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] border border-edge',
          'w-full relative max-h-[90vh] overflow-y-auto',
          'animate-fade-up',
          sizeClasses[size],
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-edge">
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="dialog-title"
                  className="font-display text-lg font-semibold text-content leading-snug"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="dialog-description"
                  className="text-sm text-content-muted mt-1"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className={[
                'shrink-0 inline-flex items-center justify-center h-8 w-8',
                'rounded-[var(--radius-md)] text-content-muted',
                'hover:bg-surface hover:text-content',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              ].join(' ')}
            >
              <XCircle size={20} weight="regular" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* If no title/description, still show close button */}
        {!title && !description && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className={[
              'absolute top-4 right-4 z-10',
              'inline-flex items-center justify-center h-8 w-8',
              'rounded-[var(--radius-md)] text-content-muted',
              'hover:bg-surface hover:text-content',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
            ].join(' ')}
          >
            <XCircle size={20} weight="regular" aria-hidden="true" />
          </button>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-5 pt-4 border-t border-edge flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
