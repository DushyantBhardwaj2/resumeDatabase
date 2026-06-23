import * as React from 'react'

type SeparatorOrientation = 'horizontal' | 'vertical'

export interface SeparatorProps {
  orientation?: SeparatorOrientation
  className?: string
}

export function Separator({
  orientation = 'horizontal',
  className = '',
}: SeparatorProps) {
  if (orientation === 'vertical') {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={['inline-block w-px h-full bg-edge', className]
          .filter(Boolean)
          .join(' ')}
      />
    )
  }

  return (
    <span
      role="separator"
      aria-orientation="horizontal"
      className={['block h-px w-full bg-edge', className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
