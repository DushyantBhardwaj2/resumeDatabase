'use client'

import { useState, useEffect } from 'react'
import { PaperPlaneRight } from '@phosphor-icons/react'

export function ChatComposer({
  onSubmit,
  generating,
}: {
  onSubmit: (text: string) => void
  generating: boolean
}) {
  const [composerText, setComposerText] = useState('')

  useEffect(() => {
    const handleAutofill = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      setComposerText(customEvent.detail || '')
    }
    window.addEventListener('autofill-composer', handleAutofill)
    return () => window.removeEventListener('autofill-composer', handleAutofill)
  }, [])

  return (
    <div className="shrink-0 border-t border-edge p-3 md:p-4">
      <div className="flex items-end gap-2 bg-card border border-edge rounded-[var(--radius-md)] px-3 py-2 focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/20 transition-all">
        <textarea
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (composerText.trim() && !generating) {
                onSubmit(composerText)
                setComposerText('')
              }
            }
          }}
          placeholder="Paste the job description or tell me the role..."
          rows={2}
          className="flex-1 bg-transparent text-sm text-content placeholder:text-content-subtle resize-none outline-none max-h-32"
        />
        <button
          onClick={() => {
            if (composerText.trim() && !generating) {
              onSubmit(composerText)
              setComposerText('')
            }
          }}
          disabled={!composerText.trim() || generating}
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] bg-brand text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
          aria-label="Send"
        >
          {generating ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <PaperPlaneRight size={16} weight="fill" />
          )}
        </button>
      </div>
    </div>
  )
}
