import type { SectionType } from "../../domain/entities"
import type { IAIService, ISchema } from "../ports/ai-service"

export interface SectionConfig {
  prompt: string
  schema: ISchema<unknown>
}

export class AiUseCases {
  constructor(
    private aiService: IAIService,
    private sectionConfigs: Record<string, SectionConfig>
  ) {}

  async generate(section: SectionType, rawInput: string, context?: Record<string, unknown>) {
    const config = this.sectionConfigs[section]
    if (!config) throw new Error(`Unknown section: ${section}`)
    const systemPrompt = `${config.prompt}\n\nAdditional context: ${JSON.stringify(context ?? {})}`
    const userContent = `Raw input: "${rawInput}"`
    return this.aiService.generateStructuredData(systemPrompt, userContent, config.schema)
  }
}
