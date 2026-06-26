'use client'

import { useRef, useCallback, useEffect } from 'react'

interface SplitterProps {
  onResize: (delta: number) => void
}

export function Splitter({ onResize }: SplitterProps) {
  const dragging = useRef(false)
  const startX = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
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
      className="relative w-1.5 cursor-col-resize shrink-0 group flex items-center justify-center"
      onPointerDown={handlePointerDown}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onResize(-20)
        else if (e.key === 'ArrowRight') onResize(20)
      }}
    >
      <div className="w-0.5 h-full bg-edge group-hover:bg-brand/40 group-active:bg-brand/60 transition-colors rounded-full" />
    </div>
  )
}
