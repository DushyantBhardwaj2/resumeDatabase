import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulletChecklist } from '@/components/generate/BulletChecklist'

const mockToggleBullet = vi.fn()
const mockSetSelections = vi.fn()

const mockProfile = {
  experience: [
    {
      id: 'exp-1',
      company: 'Google',
      role: 'SWE',
      vaultBullets: [
        { id: 'b-1', text: 'Built search features' },
        { id: 'b-2', text: 'Optimized queries' },
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Portfolio',
      vaultBullets: [{ id: 'b-3', text: 'Built with React' }],
    },
  ],
}

const mockStore = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  selectedBulletIds: {} as Record<string, string[]>,
  status: 'idle' as string,
}))

vi.mock('@/store/useBuilderStore', () => ({
  useBuilderStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      profile: mockStore.profile,
      selectedBulletIds: mockStore.selectedBulletIds,
      status: mockStore.status,
      toggleBullet: mockToggleBullet,
      setSelections: mockSetSelections,
    }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.profile = null
  mockStore.selectedBulletIds = {}
  mockStore.status = 'idle'
})

describe('BulletChecklist', () => {
  it('renders header even when profile is null', () => {
    render(<BulletChecklist />)
    expect(screen.getByText('Select bullets to include')).toBeInTheDocument()
    expect(screen.getByText('0 / 0 selected')).toBeInTheDocument()
  })

  it('renders bullet groups for experience and projects', () => {
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    mockStore.selectedBulletIds = { 'exp-1': ['b-1'], 'proj-1': ['b-3'] }
    render(<BulletChecklist />)
    expect(screen.getByText('SWE — Google')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    expect(screen.getByText('Built search features')).toBeInTheDocument()
    expect(screen.getByText('Optimized queries')).toBeInTheDocument()
  })

  it('shows selected count', () => {
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    mockStore.selectedBulletIds = { 'exp-1': ['b-1', 'b-2'], 'proj-1': ['b-3'] }
    render(<BulletChecklist />)
    expect(screen.getByText('3 / 3 selected')).toBeInTheDocument()
  })

  it('calls toggleBullet when clicking a bullet', async () => {
    const user = userEvent.setup()
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    mockStore.selectedBulletIds = { 'exp-1': ['b-1'], 'proj-1': ['b-3'] }
    render(<BulletChecklist />)
    await user.click(screen.getByText('Built search features'))
    expect(mockToggleBullet).toHaveBeenCalledWith('exp-1', 'b-1')
  })

  it('calls setSelections on Select All', async () => {
    const user = userEvent.setup()
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    mockStore.selectedBulletIds = { 'exp-1': ['b-1'], 'proj-1': ['b-3'] }
    render(<BulletChecklist />)
    await user.click(screen.getByText('Select All'))
    expect(mockSetSelections).toHaveBeenCalledWith({
      'exp-1': ['b-1', 'b-2'],
      'proj-1': ['b-3'],
    })
  })

  it('calls setSelections on Deselect All', async () => {
    const user = userEvent.setup()
    mockStore.profile = mockProfile as unknown as Record<string, unknown>
    mockStore.selectedBulletIds = { 'exp-1': ['b-1'], 'proj-1': ['b-3'] }
    render(<BulletChecklist />)
    await user.click(screen.getByText('Deselect All'))
    expect(mockSetSelections).toHaveBeenCalledWith({
      'exp-1': [],
      'proj-1': [],
    })
  })
})
