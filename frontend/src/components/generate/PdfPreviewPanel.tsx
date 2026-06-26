'use client'

import { useBuilderStore } from '@/store/useBuilderStore'
import { Plus, Minus, Download } from '@phosphor-icons/react'

export function PdfPreviewPanel() {
  const pdfUrl = useBuilderStore((s) => s.pdfUrl)
  const isCompiling = useBuilderStore((s) => s.isCompiling)
  const status = useBuilderStore((s) => s.status)
  const zoom = useBuilderStore((s) => s.zoom)
  const setZoom = useBuilderStore((s) => s.setZoom)

  const handleDownload = () => {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = 'resume.pdf'
    a.click()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold tracking-widest text-content-subtle uppercase">
          Preview
        </h2>
        {pdfUrl && (
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-surface border border-edge rounded-[var(--radius-md)] px-1.5 py-1">
              <button
                onClick={() => setZoom(zoom - 10)}
                disabled={zoom <= 50}
                className="flex items-center justify-center w-5 h-5 text-content-subtle hover:text-content disabled:opacity-30 transition-colors"
                aria-label="Zoom out"
              >
                <Minus size={12} />
              </button>
              <span className="text-[11px] font-mono text-content-muted min-w-[2.5ch] text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(zoom + 10)}
                disabled={zoom >= 200}
                className="flex items-center justify-center w-5 h-5 text-content-subtle hover:text-content disabled:opacity-30 transition-colors"
                aria-label="Zoom in"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[var(--radius-md)] bg-brand text-white hover:bg-brand-hover transition-colors"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        )}
      </div>

      {/* PDF display area */}
      <div className="flex-1 bg-[#f0f0f0] dark:bg-[#111318] rounded-[var(--radius-md)] overflow-hidden flex items-start justify-center p-4">
        {isCompiling && (
          <div className="flex items-center gap-3 text-content-muted text-sm mt-12">
            <span className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            Re-rendering PDF...
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center mt-12 text-center">
            <p className="text-sm font-medium text-red-500">Compilation Error</p>
            <p className="text-xs text-content-muted mt-1">Check your LaTeX template for errors.</p>
          </div>
        )}
        {pdfUrl && status === 'ready' ? (
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="bg-white shadow-xl transition-all duration-200 border-0"
            style={{
              width: `${Math.max(8.5 * zoom, 100)}%`,
              height: `${11 * zoom}px`,
              minHeight: '400px',
              maxWidth: '100%',
            }}
            title="Resume Preview"
          />
        ) : null}
        {!pdfUrl && status === 'idle' && (
          <div className="flex flex-col items-center mt-12 text-center">
            <div className="w-16 h-20 border-2 border-dashed border-edge rounded-lg flex items-center justify-center mb-3">
              <span className="text-2xl text-content-subtle">PDF</span>
            </div>
            <p className="text-sm text-content-muted">Your resume will appear here</p>
            <p className="text-xs text-content-subtle mt-1">Fill in the job details and create your resume</p>
          </div>
        )}
        {!pdfUrl && status === 'selecting' && (
          <div className="flex items-center gap-3 text-content-muted text-sm mt-12">
            <span className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            Compiling initial PDF...
          </div>
        )}
      </div>
    </div>
  )
}
