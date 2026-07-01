import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBuilderStore } from '@/store/useBuilderStore'

// Reset store between tests
function getStore() {
  return useBuilderStore.getState()
}

beforeEach(() => {
  useBuilderStore.getState().reset()
  vi.clearAllMocks()
  // Mock URL.revokeObjectURL since jsdom doesn't implement it
  vi.stubGlobal('URL', {
    ...URL,
    revokeObjectURL: vi.fn(),
    createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
  })
})

// ── toggleBullet ──────────────────────────────────────────────────────────────

describe('toggleBullet', () => {
  it('adds a bulletId to an item for the first time', () => {
    getStore().toggleBullet('item-1', 'bullet-a')
    expect(getStore().selectedBulletIds['item-1']).toEqual(['bullet-a'])
  })

  it('adds a second bulletId to an existing item', () => {
    getStore().toggleBullet('item-1', 'bullet-a')
    getStore().toggleBullet('item-1', 'bullet-b')
    expect(getStore().selectedBulletIds['item-1']).toEqual(['bullet-a', 'bullet-b'])
  })

  it('removes a bulletId when already selected (toggle off)', () => {
    getStore().toggleBullet('item-1', 'bullet-a')
    getStore().toggleBullet('item-1', 'bullet-b')
    getStore().toggleBullet('item-1', 'bullet-a')
    expect(getStore().selectedBulletIds['item-1']).toEqual(['bullet-b'])
  })

  it('creates separate lists for different items', () => {
    getStore().toggleBullet('item-1', 'b1')
    getStore().toggleBullet('item-2', 'b2')
    expect(getStore().selectedBulletIds['item-1']).toEqual(['b1'])
    expect(getStore().selectedBulletIds['item-2']).toEqual(['b2'])
  })

  it('produces an empty list when the only bullet is toggled off', () => {
    getStore().toggleBullet('item-1', 'b1')
    getStore().toggleBullet('item-1', 'b1')
    expect(getStore().selectedBulletIds['item-1']).toEqual([])
  })
})

// ── setZoom ───────────────────────────────────────────────────────────────────

describe('setZoom', () => {
  it('sets valid zoom values', () => {
    getStore().setZoom(100)
    expect(getStore().zoom).toBe(100)
  })

  it('clamps zoom to minimum 50', () => {
    getStore().setZoom(10)
    expect(getStore().zoom).toBe(50)
  })

  it('clamps zoom to maximum 200', () => {
    getStore().setZoom(500)
    expect(getStore().zoom).toBe(200)
  })

  it('accepts boundary values exactly', () => {
    getStore().setZoom(50)
    expect(getStore().zoom).toBe(50)
    getStore().setZoom(200)
    expect(getStore().zoom).toBe(200)
  })
})

// ── setPdfUrl ─────────────────────────────────────────────────────────────────

describe('setPdfUrl', () => {
  it('sets the pdfUrl', () => {
    getStore().setPdfUrl('blob:url-1')
    expect(getStore().pdfUrl).toBe('blob:url-1')
  })

  it('revokes the previous URL when setting a new one', () => {
    getStore().setPdfUrl('blob:old-url')
    getStore().setPdfUrl('blob:new-url')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old-url')
  })

  it('handles null gracefully', () => {
    getStore().setPdfUrl(null)
    expect(getStore().pdfUrl).toBeNull()
  })
})

// ── revokePdfUrl ──────────────────────────────────────────────────────────────

describe('revokePdfUrl', () => {
  it('revokes and clears pdfUrl', () => {
    useBuilderStore.setState({ pdfUrl: 'blob:to-revoke' })
    getStore().revokePdfUrl()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:to-revoke')
    expect(getStore().pdfUrl).toBeNull()
  })

  it('does nothing when pdfUrl is null', () => {
    getStore().revokePdfUrl()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})

// ── setSelections ─────────────────────────────────────────────────────────────

describe('setSelections', () => {
  it('replaces all selected bullet IDs entirely', () => {
    getStore().toggleBullet('item-1', 'b1')
    const newSelections = { 'item-2': ['b2', 'b3'] }
    getStore().setSelections(newSelections)
    expect(getStore().selectedBulletIds).toEqual(newSelections)
    expect(getStore().selectedBulletIds['item-1']).toBeUndefined()
  })
})

// ── simple setters ────────────────────────────────────────────────────────────

describe('simple setters', () => {
  it('setStatus updates status', () => {
    getStore().setStatus('compiling')
    expect(getStore().status).toBe('compiling')
  })

  it('setCurrentStage updates currentStage', () => {
    getStore().setCurrentStage('reviewing')
    expect(getStore().currentStage).toBe('reviewing')
  })

  it('setTemplate updates template', () => {
    getStore().setTemplate('ats-clean')
    expect(getStore().template).toBe('ats-clean')
  })

  it('setDocumentType updates documentType', () => {
    getStore().setDocumentType('cv')
    expect(getStore().documentType).toBe('cv')
  })
})

// ── reset ─────────────────────────────────────────────────────────────────────

describe('reset', () => {
  it('resets all fields to defaults', () => {
    getStore().setJobTitle('SWE')
    getStore().setCompany('Google')
    getStore().toggleBullet('item-1', 'b1')
    getStore().setZoom(150)
    getStore().setStatus('ready')
    useBuilderStore.setState({ pdfUrl: 'blob:something' })

    getStore().reset()

    const s = getStore()
    expect(s.jobTitle).toBe('')
    expect(s.company).toBe('')
    expect(s.selectedBulletIds).toEqual({})
    expect(s.zoom).toBe(100)
    expect(s.status).toBe('idle')
    expect(s.pdfUrl).toBeNull()
    expect(s.isCompiling).toBe(false)
  })

  it('revokes pdfUrl on reset', () => {
    useBuilderStore.setState({ pdfUrl: 'blob:to-be-revoked' })
    getStore().reset()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:to-be-revoked')
  })
})
