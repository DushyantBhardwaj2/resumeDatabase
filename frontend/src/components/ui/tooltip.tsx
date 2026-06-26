import * as React from 'react'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  /** Reserved for future directional support. Currently only 'top' is implemented via CSS. */
  side?: 'top'
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={[
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
          'px-2 py-1 bg-content text-surface text-xs',
          'rounded-[var(--radius-sm)] whitespace-nowrap pointer-events-none',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'z-50',
          // Arrow
          "after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2",
          'after:border-4 after:border-transparent after:border-t-content',
        ].join(' ')}
      >
        {content}
      </span>
    </span>
  )
}
