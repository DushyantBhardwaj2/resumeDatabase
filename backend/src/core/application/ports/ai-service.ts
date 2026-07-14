export interface ISchema<T> {
  parse(data: unknown): T
}

export interface IAIService {
  generate(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<string>

  generateStructuredData<T>(
    systemPrompt: string,
    userContent: string,
    schema: ISchema<T>,
    options?: { maxRetries?: number }
  ): Promise<T>
}
