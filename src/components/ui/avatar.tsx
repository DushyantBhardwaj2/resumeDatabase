import * as React from 'react'

type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  src?: string
  name?: string
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-sm',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const baseClasses = [
    'rounded-full overflow-hidden flex-shrink-0 inline-flex items-center justify-center',
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (src) {
    return (
      <span className={baseClasses}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ?? 'Avatar'}
          className="object-cover w-full h-full"
        />
      </span>
    )
  }

  return (
    <span className={[baseClasses, 'bg-brand-light text-brand font-semibold'].join(' ')}>
      {name ? getInitials(name) : null}
    </span>
  )
}
