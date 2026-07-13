'use client'

import { useRef, useCallback, useEffect } from 'react'

interface SplitterProps {
  onResize: (delta: number) => void
  value?: number
  min?: number
  max?: number
}

export function Splitter({ onResize, value, min = 0, max = 100 }: SplitterProps) {
  const dragging = useRef(false)
  const startX = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    startX.current = e.clientX
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return
    const delta = e.clientX - startX.current
    startX.current = e.clientX
    onResize(delta)
  }, [onResize])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  useEffect(() => {
    const handleMove = (e: PointerEvent) => handlePointerMove(e)
    const handleUp = () => handlePointerUp()
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }
  }, [handlePointerMove, handlePointerUp])

  return (
    <div
      className="relative w-1.5 cursor-col-resize shrink-0 group flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-full"
      onPointerDown={handlePointerDown}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize panels"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onResize(-20)
        else if (e.key === 'ArrowRight') onResize(20)
        else if (e.key === 'Home') onResize(-9999)
        else if (e.key === 'End') onResize(9999)
      }}
    >
      <div className="w-0.5 h-full bg-edge group-hover:bg-brand/40 group-active:bg-brand/60 transition-colors rounded-full" />
    </div>
  )
}
