import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MobileNav from '@/components/layout/mobile-nav'

const mockPathname = vi.hoisted(() => ({ current: '/tailor' }))

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname.current,
}))

vi.mock('@/hooks/use-is-active', () => ({
  useIsActive: () => (href: string) => {
    if (href === '/dashboard' && mockPathname.current === '/dashboard') return true
    if (href !== '/dashboard' && mockPathname.current.startsWith(href)) return true
    return false
  },
}))

vi.mock('@/config/api-client', () => ({
  api: {},
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname.current = '/tailor'
})

describe('MobileNav', () => {
  it('renders the open menu button', () => {
    render(<MobileNav />)
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument()
  })

  it('opens the drawer when menu button is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByLabelText('Open navigation menu'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Close navigation menu')).toBeInTheDocument()
  })

  it('closes the drawer when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByLabelText('Open navigation menu'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Close navigation menu'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders navigation links', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByLabelText('Open navigation menu'))
    expect(screen.getByText('Generate')).toBeInTheDocument()
    expect(screen.getByText('Profile Builder')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Tips')).toBeInTheDocument()
  })

  it('marks active link with aria-current', async () => {
    mockPathname.current = '/profile'
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByLabelText('Open navigation menu'))
    const profileLink = screen.getByText('Profile Builder').closest('a')
    expect(profileLink).toHaveAttribute('aria-current', 'page')
  })

  it('closes drawer on Escape key', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByLabelText('Open navigation menu'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    const drawer = dialog.children[1]
    fireEvent.keyDown(drawer, { key: 'Escape', bubbles: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
