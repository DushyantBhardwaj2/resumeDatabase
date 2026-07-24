import { describe, it, expect, vi } from 'vitest'
import { PDFParser } from '../index'
import { PDFParse } from 'pdf-parse'

vi.mock('pdf-parse', () => {
  return {
    PDFParse: vi.fn().mockImplementation(function (this: { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> }) {
      this.getText = vi.fn().mockResolvedValue({ text: 'Sample Resume [LinkedIn](https://linkedin.com/in/john)' })
      this.destroy = vi.fn().mockResolvedValue(undefined)
    })
  }
})

describe('PDFParser', () => {
  it('enables parseHyperlinks: true when calling pdf.getText()', async () => {
    const parser = new PDFParser()
    const dummyBuffer = Buffer.from('mock pdf content')

    const resultText = await parser.extractText(dummyBuffer)

    expect(resultText).toContain('https://linkedin.com/in/john')
    const mockInstance = (PDFParse as unknown as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockInstance.getText).toHaveBeenCalledWith({ parseHyperlinks: true })
    expect(mockInstance.destroy).toHaveBeenCalled()
  })
})
