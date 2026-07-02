'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { ReactNode } from 'react'

interface ChromaGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  columns?: number
  className?: string
}

export function ChromaGrid<T>({
  items,
  renderItem,
  columns = 3,
  className = '',
}: ChromaGridProps<T>) {
  const gridRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const els = itemRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!els.length) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        },
      )

      els.forEach((el) => {
        const handleMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          gsap.to(el, {
            '--x': `${x}%`,
            '--y': `${y}%`,
            duration: 0.3,
            ease: 'power2.out',
          })
        }

        const handleLeave = () => {
          gsap.to(el, {
            '--x': '50%',
            '--y': '50%',
            duration: 0.5,
            ease: 'power2.out',
          })
        }

        el.addEventListener('mousemove', handleMove)
        el.addEventListener('mouseleave', handleLeave)

        el.style.setProperty('--x', '50%')
        el.style.setProperty('--y', '50%')
      })
    }, gridRef)

    return () => ctx.revert()
  }, [items])

  return (
    <div
      ref={gridRef}
      className={[
        'grid gap-4',
        columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : '',
        columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : '',
        columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item, index) => (
        <div
          key={index}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          className="relative rounded-[var(--radius-lg)] overflow-hidden bg-card border border-edge transition-colors"
          style={
            {
              '--x': '50%',
              '--y': '50%',
            } as React.CSSProperties
          }
        >
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at var(--x, 50%) var(--y, 50%), var(--brand) 0%, transparent 60%)',
              opacity: 0.08,
            }}
          />
          <div className="relative z-10">{renderItem(item, index)}</div>
        </div>
      ))}
    </div>
  )
}
