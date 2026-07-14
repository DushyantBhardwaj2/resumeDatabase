import type { IAIService, ISchema } from "../ports/ai-service"
import type { IPDFParser } from "../ports/pdf-parser"
import type { DomainMemoryAction } from "../../domain/entities"
import { memoryExtractSchema } from "./schemas"

function makeSchema<T>(schema: z.ZodType<T>): ISchema<T> {
  return { parse: (data: unknown) => schema.parse(data) }
}

import { z } from "zod"

export class ParseUseCases {
  constructor(
    private pdfParser: IPDFParser,
    private aiService: IAIService,
    private extractPrompt: string,
  ) {}

  async parsePdf(buffer: Buffer): Promise<{ rawText: string; actions: DomainMemoryAction[] }> {
    const rawText = await this.pdfParser.extractText(buffer)

    try {
      const result = await this.aiService.generateStructuredData(
        this.extractPrompt,
        rawText,
        makeSchema(memoryExtractSchema)
      )
      return { rawText, actions: (result.actions ?? []) as DomainMemoryAction[] }
    } catch {
      return { rawText, actions: [] }
    }
  }
}
