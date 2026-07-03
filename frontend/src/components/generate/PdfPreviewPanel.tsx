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
    <div className="flex flex-col h-full bg-[#525659] relative">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 w-full px-5 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-md border-b border-edge/50 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-[15px] text-fg m-0">Live Preview</h3>
          <span className="text-[11px] text-content-muted bg-card px-2.5 py-0.5 rounded-[var(--radius-pill)] border border-edge">
            A4 Format
          </span>
        </div>
        
        {pdfUrl && (
          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-surface border border-edge rounded-[var(--radius-md)] px-1.5 py-1 hidden sm:flex">
              <button
                onClick={() => setZoom(zoom - 10)}
                disabled={zoom <= 50}
                className="flex items-center justify-center w-6 h-6 text-content-subtle hover:text-content disabled:opacity-30 transition-colors rounded hover:bg-muted"
                aria-label="Zoom out"
              >
                <Minus size={14} />
              </button>
              <span className="text-[11px] font-mono text-content-muted min-w-[3.5ch] text-center font-medium">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(zoom + 10)}
                disabled={zoom >= 200}
                className="flex items-center justify-center w-6 h-6 text-content-subtle hover:text-content disabled:opacity-30 transition-colors rounded hover:bg-muted"
                aria-label="Zoom in"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-[var(--radius-md)] bg-brand text-white hover:bg-brand-hover transition-all shadow-[0_0_12px_rgba(22,163,74,0.3)] hover:shadow-[0_0_16px_rgba(22,163,74,0.4)]"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* PDF display area */}
      <div className="flex-1 flex items-start justify-center p-6 pt-24 overflow-auto relative">
        {isCompiling && (
          <div className="absolute top-28 right-8 z-20 flex items-center gap-2 bg-surface/90 border border-edge backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-xs text-content font-medium">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            Updating PDF...
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center mt-12 text-center z-10">
            <p className="text-sm font-medium text-red-500">Compilation Error</p>
            <p className="text-xs text-content-muted mt-1">Check your LaTeX template for errors.</p>
          </div>
        )}
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className={`bg-white shadow-xl transition-all duration-200 border-0 ${isCompiling ? 'opacity-75' : ''}`}
            style={{
              width: `${Math.max(8.5 * zoom, 100)}%`,
              height: `${11 * zoom}px`,
              minHeight: '400px',
              maxWidth: '100%',
            }}
            title="Resume Preview"
          />
        ) : (
          status === 'idle' && (
            <div className="flex flex-col items-center mt-12 text-center">
              <div className="w-16 h-20 border-2 border-dashed border-edge rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl text-content-subtle">PDF</span>
              </div>
              <p className="text-sm text-content-muted">Your resume will appear here</p>
              <p className="text-xs text-content-subtle mt-1">Fill in the job details and create your resume</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
