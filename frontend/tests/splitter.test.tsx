import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Splitter } from '@/components/ui/splitter'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Splitter', () => {
  it('renders with correct ARIA attributes', () => {
    render(<Splitter onResize={vi.fn()} value={55} />)
    const el = screen.getByRole('separator')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-orientation', 'vertical')
    expect(el).toHaveAttribute('aria-label', 'Resize panels')
    expect(el).toHaveAttribute('aria-valuenow', '55')
  })

  it('accepts custom min and max', () => {
    render(<Splitter onResize={vi.fn()} value={30} min={20} max={80} />)
    const el = screen.getByRole('separator')
    expect(el).toHaveAttribute('aria-valuemin', '20')
    expect(el).toHaveAttribute('aria-valuemax', '80')
  })

  it('calls onResize with -20 on ArrowLeft', async () => {
    const onResize = vi.fn()
    const user = userEvent.setup()
    render(<Splitter onResize={onResize} />)
    const el = screen.getByRole('separator')
    el.focus()
    await user.keyboard('{ArrowLeft}')
    expect(onResize).toHaveBeenCalledWith(-20)
  })

  it('calls onResize with 20 on ArrowRight', async () => {
    const onResize = vi.fn()
    const user = userEvent.setup()
    render(<Splitter onResize={onResize} />)
    const el = screen.getByRole('separator')
    el.focus()
    await user.keyboard('{ArrowRight}')
    expect(onResize).toHaveBeenCalledWith(20)
  })

  it('is focusable with tabIndex', () => {
    render(<Splitter onResize={vi.fn()} />)
    const el = screen.getByRole('separator')
    expect(el).toHaveAttribute('tabindex', '0')
  })
})
