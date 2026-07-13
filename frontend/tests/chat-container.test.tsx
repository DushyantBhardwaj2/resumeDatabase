import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatContainer } from '@/components/chat/ChatContainer'

const mockSendMessage = vi.fn()
const mockSetMode = vi.fn()
interface MockMsg { id: string; role: string; content: string; type: string }

const mockStore = vi.hoisted(() => ({
  messagesByMode: {} as Record<string, MockMsg[]>,
  mode: 'ONBOARDING' as string,
  isTyping: false,
}))

vi.mock('@/store/useChatStore', () => ({
  useChatStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      messagesByMode: mockStore.messagesByMode,
      mode: mockStore.mode,
      isTyping: mockStore.isTyping,
      sendMessage: mockSendMessage,
      setMode: mockSetMode,
    }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.messagesByMode = { ONBOARDING: [], BUILDER: [] } as Record<string, MockMsg[]>
  mockStore.mode = 'ONBOARDING'
  mockStore.isTyping = false
})

describe('ChatContainer', () => {
  it('renders empty state message', () => {
    render(<ChatContainer mode="ONBOARDING" />)
    expect(screen.getByText('Start a conversation to build your resume...')).toBeInTheDocument()
  })

  it('renders messages', () => {
    mockStore.messagesByMode = {
      ONBOARDING: [
        { id: '1', role: 'assistant', content: 'Hello!', type: 'text' },
        { id: '2', role: 'user', content: 'Hi there', type: 'text' },
      ] as MockMsg[],
    }
    render(<ChatContainer mode="ONBOARDING" />)
    expect(screen.getByText('Hello!')).toBeInTheDocument()
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })

  it('renders typing indicator when isTyping is true', () => {
    mockStore.isTyping = true
    render(<ChatContainer mode="ONBOARDING" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('hides input when renderInput is false', () => {
    render(<ChatContainer mode="ONBOARDING" renderInput={false} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('calls sendMessage when user types and submits', async () => {
    const user = userEvent.setup()
    render(<ChatContainer mode="ONBOARDING" />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    expect(mockSendMessage).toHaveBeenCalledWith('Test message')
  })
})
