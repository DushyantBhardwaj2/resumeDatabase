export type TemplateConfig = {
  id: string
  name: string
  description: string
  placeholders: {
    contact: string[]
    education: { maxEntries: number; fields: string[] }
    experience: { maxEntries: number; maxBullets: number; fields: string[] }
    projects: { maxEntries: number; maxBullets: number; fields: string[] }
    skills: string[]
  }
  sections: string[]
}

export interface ILatexTemplateFiller {
  getTemplateConfig(templateId: string): TemplateConfig
  fill(
    templateId: string,
    contact: Record<string, unknown> | null,
    education: Array<Record<string, unknown>> | null,
    experience: Array<Record<string, unknown>> | null,
    projects: Array<Record<string, unknown>> | null,
    skills: Record<string, string[]> | null,
    tailored: unknown
  ): string
}
