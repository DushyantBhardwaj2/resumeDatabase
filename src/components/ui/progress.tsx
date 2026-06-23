import * as React from 'react'

type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressProps {
  value: number
  size?: ProgressSize
  label?: string
  showValue?: boolean
  className?: string
}

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

export function Progress({
  value,
  size = 'md',
  label,
  showValue = false,
  className = '',
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const hasHeader = label || showValue

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      {hasHeader && (
        <div className="flex justify-between items-center text-xs text-content-muted mb-1.5">
          {label && <span>{label}</span>}
          {showValue && (
            <span className={label ? '' : 'ml-auto'}>{clamped}%</span>
          )}
        </div>
      )}
      <div
        className={[
          'w-full bg-muted-bg rounded-full overflow-hidden',
          sizeClasses[size],
        ].join(' ')}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="bg-brand h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
