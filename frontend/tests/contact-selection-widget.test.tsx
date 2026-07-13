import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactSelectionWidget } from '@/components/generate/ContactSelectionWidget'

const mockSetContactSelection = vi.fn()
const mockUpdateProfile = vi.fn()
const mockUpdateContact = vi.fn()

const mockProfile = {
  contact: {
    name: 'Alice',
    email: 'alice@test.com',
    phone: '+1 555-0000',
    linkedin: 'alice-linkedin',
    github: 'alice-github',
    leetcode: 'alice-lc',
    portfolio: 'alice.dev',
  },
  experience: [],
  projects: [],
  education: [],
  skills: { languages: [], frameworks: [], tools: [] },
  certificates: [],
}

const mockStore = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  contactSelection: {} as Record<string, string | string[] | undefined>,
}))

vi.mock('@/store/useBuilderStore', () => ({
  useBuilderStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      profile: mockStore.profile,
      contactSelection: mockStore.contactSelection,
      updateProfile: mockUpdateProfile,
      setContactSelection: mockSetContactSelection,
    }),
}))

vi.mock('@/store/useProfileStore', () => ({
  useProfileStore: {
    getState: () => ({ updateContact: mockUpdateContact }),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.profile = null
  mockStore.contactSelection = {}
})

describe('ContactSelectionWidget', () => {
  it('returns null when profile is null', () => {
    const { container } = render(<ContactSelectionWidget />)
    expect(container.textContent).toBe('')
  })

  it('renders contact fields with values', () => {
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    mockStore.contactSelection = { name: 'Alice', email: 'alice@test.com' }
    render(<ContactSelectionWidget content="Confirm contact details" />)
    expect(screen.getByText('Confirm contact details')).toBeInTheDocument()
    expect(screen.getByText('Contact Information')).toBeInTheDocument()
  })

  it('renders Confirm & Next button', () => {
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    render(<ContactSelectionWidget />)
    expect(screen.getByText('Confirm & Next')).toBeInTheDocument()
  })

  it('calls onNext when Confirm & Next is clicked', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    mockStore.contactSelection = {
      name: 'Alice',
      email: 'alice@test.com',
      phone: '+1 555-0000',
      linkedin: 'alice-linkedin',
      github: 'alice-github',
      leetcode: 'alice-lc',
      portfolio: 'alice.dev',
    }
    render(<ContactSelectionWidget onNext={onNext} />)
    await user.click(screen.getByText('Confirm & Next'))
    expect(onNext).toHaveBeenCalled()
  })
})
