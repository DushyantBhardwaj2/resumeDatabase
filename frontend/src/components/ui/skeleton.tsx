import * as React from 'react'

export interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ className = '', width, height, style }: SkeletonProps) {
  return (
    <div
      className={[
        'rounded-[var(--radius-sm)] bg-muted-bg shimmer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({
  className = '',
  width,
  ...props
}: Omit<SkeletonProps, 'height'>) {
  return (
    <Skeleton
      className={['h-4 w-full', className].filter(Boolean).join(' ')}
      width={width}
      {...props}
    />
  )
}

export function SkeletonTitle({ className = '', ...props }: Omit<SkeletonProps, 'height'>) {
  return (
    <Skeleton
      className={['h-6 w-48', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

export function SkeletonCard({ className = '', ...props }: Omit<SkeletonProps, 'height'>) {
  return (
    <Skeleton
      className={[
        'rounded-[var(--radius-lg)] h-32 w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
