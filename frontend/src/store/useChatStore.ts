import { create } from 'zustand'

export type ChatMessage = {
  id: string | number
  role: 'user' | 'assistant' | 'system'
  content: string
  widget?: string | null
  meta?: Record<string, unknown>
}

export type OnboardingPhase =
  | 'GREETING'
  | 'AWAITING_RESUME_OR_TEXT'
  | 'PROCESSING_UPLOAD'
  | 'REVIEW_EXPERIENCE'
  | 'REVIEW_PROJECTS'
  | 'REVIEW_SKILLS'
  | 'REVIEW_CONTACT_AND_CERTS'
  | 'COMPLETE'

type ChatMode = 'ONBOARDING' | 'BUILDER' | 'DASHBOARD' | 'TAILOR'

interface ChatStore {
  messages: ChatMessage[]
  currentPhase: OnboardingPhase
  isTyping: boolean
  mode: ChatMode

  addMessage: (msg: ChatMessage) => void
  setTyping: (typing: boolean) => void
  setPhase: (phase: OnboardingPhase) => void
  setMode: (mode: ChatMode) => void
  clearChat: () => void
  sendMessage: (text: string) => Promise<void>
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  currentPhase: 'GREETING',
  isTyping: false,
  mode: 'ONBOARDING',

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setTyping: (typing) => set({ isTyping: typing }),

  setPhase: (phase) => set({ currentPhase: phase }),

  setMode: (mode) => set({ mode }),

  clearChat: () => set({ messages: [], currentPhase: 'GREETING', isTyping: false }),

  sendMessage: async (text) => {
    const { messages, currentPhase, mode } = get()

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
    }
    set((state) => ({ messages: [...state.messages, userMsg], isTyping: true }))

    try {
      const res = await fetch('/api/protected/chat/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentState: { phase: currentPhase },
          mode,
        }),
      })

      if (!res.ok) throw new Error('Chat request failed')

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        widget: data.targetWidget,
      }

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isTyping: false,
        currentPhase: data.intent === 'NAVIGATE' && data.targetWidget
          ? mapWidgetToPhase(data.targetWidget)
          : state.currentPhase,
      }))
    } catch {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: "Sorry, I couldn't process that. Please try again.",
            widget: null,
          },
        ],
        isTyping: false,
      }))
    }
  },
}))

function mapWidgetToPhase(widget: string): OnboardingPhase {
  const map: Record<string, OnboardingPhase> = {
    CONTACT: 'REVIEW_CONTACT_AND_CERTS',
    EXPERIENCE: 'REVIEW_EXPERIENCE',
    PROJECTS: 'REVIEW_PROJECTS',
    SKILLS: 'REVIEW_SKILLS',
    CERTIFICATES: 'REVIEW_CONTACT_AND_CERTS',
    REVIEW: 'COMPLETE',
    UPLOAD_DROPZONE: 'AWAITING_RESUME_OR_TEXT',
  }
  return map[widget] || 'GREETING'
}
