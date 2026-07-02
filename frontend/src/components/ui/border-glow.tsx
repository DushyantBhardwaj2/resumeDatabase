'use client'

import type { ReactNode } from 'react'

interface BorderGlowProps {
  children: ReactNode
  animated?: boolean
  glowColor?: string
  className?: string
}

export function BorderGlow({
  children,
  animated = false,
  glowColor = '#16A34A',
  className = '',
}: BorderGlowProps) {
  return (
    <div
      className={[
        'relative rounded-[var(--radius-xl)] overflow-hidden',
        animated ? 'glow-active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--glow-color': glowColor,
        } as React.CSSProperties
      }
    >
      {animated && <div className="glow-border" />}
      <div className="relative z-10">{children}</div>
      <style>{`
        .glow-active {
          --glow-size: 60%;
        }
        .glow-border {
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            var(--glow-color) 60deg,
            transparent 120deg,
            var(--glow-color) 180deg,
            transparent 240deg,
            var(--glow-color) 300deg,
            transparent 360deg
          );
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          animation: rotate-glow 3s linear infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
