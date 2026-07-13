import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerateChatWorkspace } from '@/components/generate/GenerateChatWorkspace'

const mockHandleSubmitJD = vi.fn()
const mockAddChatEntry = vi.fn()
const mockTriggerCompile = vi.fn()
const mockSetCurrentStage = vi.fn()
const mockSetJobTitle = vi.fn()
const mockSetCompany = vi.fn()

const mockEntries = vi.hoisted(() => [
  { id: 'greeting', role: 'assistant', type: 'greeting' as const },
])

vi.mock('@/components/generate/useTailorChat', () => ({
  useTailorChat: () => ({
    entries: mockEntries,
    generating: false,
    handleSubmitJD: mockHandleSubmitJD,
    addChatEntry: mockAddChatEntry,
  }),
}))

const mockStore = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  status: 'idle' as string,
  selectedBulletIds: {} as Record<string, string[]>,
  selectedExperienceIds: [] as string[],
  selectedProjectIds: [] as string[],
  contactSelection: {} as Record<string, string | string[] | undefined>,
  currentStage: 'collecting' as string,
  template: 'nsut-canonical' as string,
}))

vi.mock('@/store/useBuilderStore', () => ({
  useBuilderStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      profile: mockStore.profile,
      status: mockStore.status,
      selectedBulletIds: mockStore.selectedBulletIds,
      selectedExperienceIds: mockStore.selectedExperienceIds,
      selectedProjectIds: mockStore.selectedProjectIds,
      contactSelection: mockStore.contactSelection,
      currentStage: mockStore.currentStage,
      template: mockStore.template,
      triggerCompile: mockTriggerCompile,
      setCurrentStage: mockSetCurrentStage,
      setJobTitle: mockSetJobTitle,
      setCompany: mockSetCompany,
    }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockEntries.length = 0
  mockEntries.push({ id: 'greeting', role: 'assistant', type: 'greeting' })
  mockStore.profile = null
  mockStore.status = 'idle'
  mockStore.currentStage = 'collecting'
})

describe('GenerateChatWorkspace', () => {
  it('renders the chat workspace with greeting', () => {
    render(<GenerateChatWorkspace />)
    expect(screen.getByText('Tailoring Agent')).toBeInTheDocument()
    expect(screen.getByText('Ready to match your profile')).toBeInTheDocument()
  })

  it('renders the greeting message content', () => {
    render(<GenerateChatWorkspace />)
    expect(screen.getByText(/paste the job description/i)).toBeInTheDocument()
  })

  it('shows tabs when profile is loaded', () => {
    mockStore.profile = { contact: {} } as unknown as Record<string, unknown>
    render(<GenerateChatWorkspace />)
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
  })

  it('renders the ChatComposer', () => {
    render(<GenerateChatWorkspace />)
    const textarea = screen.getByPlaceholderText(/paste the job description/i)
    expect(textarea).toBeInTheDocument()
  })

  it('calls handleSubmitJD when entering text and pressing Enter', async () => {
    const user = userEvent.setup()
    mockHandleSubmitJD.mockResolvedValue(true)
    render(<GenerateChatWorkspace />)
    const textarea = screen.getByPlaceholderText(/paste the job description/i)
    await user.type(textarea, 'Senior developer role at Google{Enter}')
    expect(mockHandleSubmitJD).toHaveBeenCalledWith('Senior developer role at Google')
  })

  it('shows completed state when currentStage is ready', () => {
    mockStore.currentStage = 'ready'
    render(<GenerateChatWorkspace />)
    expect(screen.getByText(/tailoring is complete/i)).toBeInTheDocument()
  })
})
