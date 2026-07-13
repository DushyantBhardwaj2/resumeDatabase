import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardWelcomeWidget } from '@/components/chat/widgets/DashboardWelcomeWidget'

describe('DashboardWelcomeWidget', () => {
  it('renders the welcome message with the user name', () => {
    render(<DashboardWelcomeWidget name="Alice" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<DashboardWelcomeWidget name="Bob" />)
    expect(screen.getByText(/career vault overview/)).toBeInTheDocument()
  })
})
