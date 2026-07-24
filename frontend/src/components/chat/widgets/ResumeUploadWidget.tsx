'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadSimple, ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { api } from '@/config/api-client'
import { useChatStore } from '@/store/useChatStore'

export function ResumeUploadWidget() {
  const router = useRouter()
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const addMessage = useChatStore((s) => s.addMessage)
  const extractedData = useChatStore((s) => s.extractedData)
  const hasExtractedData = Object.keys(extractedData || {}).length > 0

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await api.api.protected.profile.$post({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json: { parsed: extractedData as any },
      })
      if (!res.ok) throw new Error('Failed to save profile')
      useChatStore.setState({ currentPhase: 'COMPLETE' })
      toast.success('Profile created! Welcome to Resumint.')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const parseFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file')
      return
    }
    setParsing(true)
    try {
      const res = await api.api.protected.parse.$post({ form: { file } })
      const result = (await res.json()) as Record<string, unknown>
      const parsedData = (result.parsed || result.data || result) as Record<string, unknown>
      useChatStore.setState({ extractedData: parsedData })
      addMessage({
        id: 'parsed-done',
        role: 'assistant',
        content: [
          'Great! Resume parsed successfully.',
          '',
          'Take a look at the extracted information in the preview panel on the right. You can edit any details before saving.',
          '',
          'Click **Confirm & Save to Vault** below when you are ready to continue!',
        ].join('\n'),
      })
      toast.success(result.fromDb ? 'Profile loaded from your data!' : 'Resume parsed successfully!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setParsing(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  return (
    <div className="mt-3 space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !parsing && fileRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-[var(--radius-lg)] p-6 text-center cursor-pointer transition-colors duration-200',
          dragging ? 'border-brand bg-brand-light/40' : 'border-edge hover:border-brand',
          parsing ? 'opacity-60 cursor-wait' : '',
        ].join(' ')}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f) }}
        />
        {parsing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="text-xs text-content-muted">Parsing PDF...</p>
          </div>
        ) : (
          <>
            <UploadSimple size={24} className="mx-auto text-content-subtle mb-2" />
            <p className="text-xs text-content-muted">Drop PDF or click to browse</p>
          </>
        )}
      </div>

      {hasExtractedData && (
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full py-2.5 px-4 bg-brand text-brand-fg text-xs font-semibold rounded-[var(--radius-lg)] shadow hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-brand-fg border-t-transparent animate-spin" />
              Saving Profile...
            </span>
          ) : (
            <>
              <CheckCircle size={16} weight="bold" />
              Confirm & Save to Career Vault
              <ArrowRight size={14} weight="bold" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
