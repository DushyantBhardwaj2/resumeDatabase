'use client'

import { useState, useRef } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { api } from '@/config/api-client'

interface ResumeUploadWidgetProps {
  onParsed?: (data: unknown) => void
}

export function ResumeUploadWidget({ onParsed }: ResumeUploadWidgetProps) {
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file')
      return
    }
    setParsing(true)
    try {
      const res = await api.api.protected.resume.parse.$post({ form: { file } })
      const result = (await res.json()) as Record<string, unknown>
      if (!res.ok) throw new Error((result.error as string) || 'Failed to parse resume')
      onParsed?.(result.parsed)
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
    <div className="mt-3">
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
            <p className="text-xs text-content-muted">Parsing...</p>
          </div>
        ) : (
          <>
            <UploadSimple size={24} className="mx-auto text-content-subtle mb-2" />
            <p className="text-xs text-content-muted">Drop PDF or click to browse</p>
          </>
        )}
      </div>
    </div>
  )
}
