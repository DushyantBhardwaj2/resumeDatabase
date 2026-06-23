export interface IPDFParser {
  extractText(buffer: Buffer): Promise<string>
}
