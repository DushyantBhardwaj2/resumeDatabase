'use client'

import { memo } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useProfileStore } from '@/store/useProfileStore'
import { Sparkle, CheckSquare, Square, GraduationCap } from '@phosphor-icons/react'

export const EducationSelectionWidget = memo(function EducationSelectionWidget({ content, onNext }: { content?: string, onNext?: () => void }) {
  const profile = useBuilderStore((s) => s.profile)
  const selectedEducationIds = useBuilderStore((s) => s.selectedEducationIds)
  const toggleEducation = useBuilderStore((s) => s.toggleEducation)

  if (!profile || !profile.education?.length) {
    return (
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => onNext?.()}
          className="px-4 py-2 bg-brand/10 text-brand hover:bg-brand/20 transition-colors rounded-md text-sm font-medium"
        >
          Skip Education & Next
        </button>
      </div>
    )
  }

  const handleNext = () => {
    if (onNext) onNext()
  }

  const getEduId = (edu: typeof profile.education[0]) => edu.school + '|' + edu.degree

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Sparkle size={16} className="text-brand" />
        </div>
        <div className="pt-1.5">
          <p className="text-sm text-content leading-relaxed">{content}</p>
        </div>
      </div>
      
      <div className="ml-11 bg-surface/50 border border-edge rounded-xl p-5 shadow-sm backdrop-blur-md">
        <h4 className="text-sm font-semibold text-fg mb-4">Education</h4>
        
        <div className="space-y-2">
          {profile.education.map((edu) => {
            const id = getEduId(edu)
            const isSelected = selectedEducationIds.includes(id)
            return (
              <button
                key={id}
                onClick={() => toggleEducation(id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] text-left transition-colors border ${
                  isSelected ? 'border-brand/50 bg-card' : 'border-edge bg-surface opacity-75'
                }`}
              >
                {isSelected ? (
                  <CheckSquare size={16} className="text-brand shrink-0" weight="fill" />
                ) : (
                  <Square size={16} className="text-content-subtle shrink-0" />
                )}
                <GraduationCap size={16} className="text-content-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content truncate">{edu.degree}</p>
                  <p className="text-xs text-content-muted truncate">{edu.school}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</p>
                </div>
                <span className="text-[10px] text-content-muted shrink-0">
                  {edu.startYear || edu.endYear ? `${edu.startYear || ''}${edu.endYear ? `-${edu.endYear}` : ''}` : ''}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleNext}
            className="px-4 py-2 bg-brand/10 text-brand hover:bg-brand/20 transition-colors rounded-md text-sm font-medium"
          >
            Confirm Education & Next
          </button>
        </div>
      </div>
    </div>
  )
})
