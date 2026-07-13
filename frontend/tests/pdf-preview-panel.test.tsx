import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PdfPreviewPanel } from '@/components/generate/PdfPreviewPanel'

const mockStore = vi.hoisted(() => ({
  pdfUrl: null as string | null,
  isCompiling: false,
  status: 'idle' as string,
  zoom: 100,
  setZoom: vi.fn(),
  revokePdfUrl: vi.fn(),
}))

vi.mock('@/store/useBuilderStore', () => ({
  useBuilderStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      pdfUrl: mockStore.pdfUrl,
      isCompiling: mockStore.isCompiling,
      status: mockStore.status,
      zoom: mockStore.zoom,
      setZoom: mockStore.setZoom,
      revokePdfUrl: mockStore.revokePdfUrl,
    }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.pdfUrl = null
  mockStore.isCompiling = false
  mockStore.status = 'idle'
  mockStore.zoom = 100
})

describe('PdfPreviewPanel', () => {
  it('renders idle state with placeholder', () => {
    render(<PdfPreviewPanel />)
    expect(screen.getByText('Your resume will appear here')).toBeInTheDocument()
  })

  it('shows downloading PDF when a URL is present', () => {
    mockStore.pdfUrl = 'blob:test'
    render(<PdfPreviewPanel />)
    expect(screen.getByTitle('Resume Preview')).toBeInTheDocument()
    expect(screen.getByText('Export PDF')).toBeInTheDocument()
  })

  it('shows compiling indicator', () => {
    mockStore.isCompiling = true
    render(<PdfPreviewPanel />)
    expect(screen.getByText('Updating PDF...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockStore.status = 'error'
    render(<PdfPreviewPanel />)
    expect(screen.getByText('Compilation Error')).toBeInTheDocument()
  })

  it('calls setZoom on zoom in/out', async () => {
    const user = userEvent.setup()
    mockStore.pdfUrl = 'blob:test'
    render(<PdfPreviewPanel />)
    await user.click(screen.getByLabelText('Zoom in'))
    expect(mockStore.setZoom).toHaveBeenCalledWith(110)
    await user.click(screen.getByLabelText('Zoom out'))
    expect(mockStore.setZoom).toHaveBeenCalledWith(90)
  })
})
