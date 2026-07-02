'use client'

import type { ReactNode } from 'react'
import type { ChatMessage } from '@/store/useChatStore'
import { ResumeUploadWidget } from './widgets/ResumeUploadWidget'
import { TailoringChecklistWidget } from './widgets/TailoringChecklistWidget'
import { DashboardWelcomeWidget } from './widgets/DashboardWelcomeWidget'
import { DashboardStatsWidget } from './widgets/DashboardStatsWidget'
import { DashboardCompletenessWidget } from './widgets/DashboardCompletenessWidget'
import { DashboardQuickActionsWidget } from './widgets/DashboardQuickActionsWidget'

interface MessageBubbleProps {
  message: ChatMessage
  renderWidget?: ((widget: string | null | undefined, meta?: Record<string, unknown>) => ReactNode) | null
}

export function MessageBubble({ message, renderWidget }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const hasCustomWidget = message.widget && renderWidget
  const customWidget = hasCustomWidget ? renderWidget!(message.widget, message.meta) : null
  if (customWidget) {
    return (
      <div className="flex w-full justify-start animate-fade-up">
        <div className="max-w-[85%] rounded-[var(--radius-xl)] p-4 bg-card border border-edge rounded-bl-sm">
          {message.content && (
            <p className="text-base whitespace-pre-wrap text-content">{message.content}</p>
          )}
          {customWidget}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-up`}>
      <div
        className={`max-w-[85%] rounded-[var(--radius-xl)] p-4 ${isUser
            ? 'bg-brand text-brand-fg rounded-br-sm'
            : 'bg-card border border-edge rounded-bl-sm'
          }`}
      >
        {message.content && (
          <p className={`text-base whitespace-pre-wrap ${isUser ? 'text-brand-fg' : 'text-content'}`}>
            {message.content}
          </p>
        )}

        {message.widget === 'UPLOAD_DROPZONE' && <ResumeUploadWidget />}
        {message.widget === 'PROJECTS' && <TailoringChecklistWidget />}
        {message.widget === 'DASHBOARD_WELCOME' && <DashboardWelcomeWidget name={(message.meta?.name as string) || 'there'} />}
        {message.widget === 'DASHBOARD_STATS' && (
          <DashboardStatsWidget
            education={(message.meta?.education as number) ?? 0}
            experience={(message.meta?.experience as number) ?? 0}
            projects={(message.meta?.projects as number) ?? 0}
            skills={(message.meta?.skills as number) ?? 0}
          />
        )}
        {message.widget === 'DASHBOARD_COMPLETENESS' && (
          <DashboardCompletenessWidget percent={(message.meta?.completeness as number) ?? 0} />
        )}
        {message.widget === 'DASHBOARD_QUICK_ACTIONS' && <DashboardQuickActionsWidget />}
      </div>
    </div>
  )
}
