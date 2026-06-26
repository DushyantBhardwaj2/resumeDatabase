'use client'

import { useEffect, useRef } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'

export function LivePdfRenderer() {
  const pdfUrl = useBuilderStore((s) => s.pdfUrl)
  const isCompiling = useBuilderStore((s) => s.isCompiling)
  const status = useBuilderStore((s) => s.status)
  const zoom = useBuilderStore((s) => s.zoom)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const profile = useBuilderStore((s) => s.profile)
  const triggerCompile = useBuilderStore((s) => s.triggerCompile)

  useEffect(() => {
    if (!profile) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      triggerCompile()
    }, 800)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [selectedBulletIds, profile, triggerCompile])

  return (
    <div className="relative w-full transition-all duration-300" style={{ maxWidth: `${800 * (zoom / 100)}px` }}>
      {isCompiling && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-opacity duration-300">
          <div className="bg-card px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-content">Re-rendering PDF...</span>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="w-full aspect-[1/1.414] bg-white shadow-xl flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-red-500">Compilation Error</p>
            <p className="text-xs text-content-muted mt-1">Check your LaTeX template for errors.</p>
          </div>
        </div>
      )}
      {pdfUrl && status === 'ready' ? (
        <iframe
          src={`${pdfUrl}#toolbar=0`}
          className="w-full border-none bg-white shadow-xl"
          style={{ aspectRatio: '1 / 1.414' }}
          title="Resume Preview"
        />
      ) : null}
      {!pdfUrl && status === 'idle' && (
        <div className="w-full aspect-[1/1.414] bg-white shadow-xl flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-content-muted">Waiting for data to render...</p>
            <p className="text-xs text-content-subtle mt-1">Enter a job description and click Create</p>
          </div>
        </div>
      )}
    </div>
  )
}
