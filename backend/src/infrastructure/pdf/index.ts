import type { IPDFParser } from "../../core/application/ports/pdf-parser"
import { PDFParse } from "pdf-parse"

export class PDFParser implements IPDFParser {
  async extractText(buffer: Buffer): Promise<string> {
    const pdf = new PDFParse({ data: buffer })
    const result = await pdf.getText({ parseHyperlinks: true })
    await pdf.destroy()
    return result.text
  }
}
