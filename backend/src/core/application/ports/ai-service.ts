export interface ISchema<T> {
  parse(data: unknown): T
}

export interface IAIService {
  generateStructuredData<T>(systemPrompt: string, userContent: string, schema: ISchema<T>): Promise<T>
}
