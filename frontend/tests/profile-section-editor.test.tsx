import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileSectionEditor } from '@/components/chat/widgets/ProfileSectionEditor'
import { getEmptyProfile } from '@/lib/normalize-profile'

describe('ProfileSectionEditor', () => {
  it('renders contact fields', () => {
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="contact" data={data} onChange={onChange} />)
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+91 98765 43210')).toBeInTheDocument()
  })

  it('renders education editor with add button', () => {
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="education" data={data} onChange={onChange} />)
    expect(screen.getByText('Add Education')).toBeInTheDocument()
  })

  it('renders experience editor with add button', () => {
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="experience" data={data} onChange={onChange} />)
    expect(screen.getByText('Add Experience')).toBeInTheDocument()
  })

  it('renders projects editor with add button', () => {
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="projects" data={data} onChange={onChange} />)
    expect(screen.getByText('Add Project')).toBeInTheDocument()
  })

  it('renders skills editor', () => {
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="skills" data={data} onChange={onChange} />)
    expect(screen.getByPlaceholderText('Add language...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Add framework...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Add tool...')).toBeInTheDocument()
  })

  it('renders certificates editor with add button', () => {
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="certificates" data={data} onChange={onChange} />)
    expect(screen.getByText('Add Certificate')).toBeInTheDocument()
  })

  it('renders existing experience items', () => {
    const data = getEmptyProfile()
    data.experience.push({
      id: 'exp-1',
      company: 'Google',
      role: 'SWE',
      startDate: '2024',
      endDate: '2025',
      current: false,
      vaultBullets: [{ id: 'b-1', text: 'Built stuff', keywords: [], isAIGenerated: false }],
    })
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="experience" data={data} onChange={onChange} />)
    expect(screen.getByDisplayValue('Google')).toBeInTheDocument()
    expect(screen.getByDisplayValue('SWE')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Built stuff')).toBeInTheDocument()
  })

  it('adds a skill tag when user types and clicks Add', async () => {
    const user = userEvent.setup()
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="skills" data={data} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Add language...')
    await user.type(input, 'TypeScript')
    const addBtn = screen.getAllByText('Add')[0]
    await user.click(addBtn)
    expect(onChange).toHaveBeenCalled()
    const updated = onChange.mock.calls[0][0] as typeof data
    expect(updated.skills.languages).toContain('TypeScript')
  })

  it('removes a skill tag when X is clicked', async () => {
    const user = userEvent.setup()
    const data = getEmptyProfile()
    data.skills.languages = ['Python']
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="skills" data={data} onChange={onChange} />)
    const removeBtn = screen.getByRole('button', { name: '' })
    await user.click(removeBtn)
    expect(onChange).toHaveBeenCalled()
    const updated = onChange.mock.calls[0][0] as typeof data
    expect(updated.skills.languages).not.toContain('Python')
  })

  it('calls onChange when editing contact field', async () => {
    const user = userEvent.setup()
    const data = getEmptyProfile()
    const onChange = vi.fn()
    render(<ProfileSectionEditor section="contact" data={data} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Your name')
    await user.type(input, 'Jane')
    expect(onChange).toHaveBeenCalled()
  })
})
