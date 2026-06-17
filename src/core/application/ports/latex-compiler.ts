export interface ILatexTemplateFiller {
  fill(
    contact: Record<string, unknown> | null,
    education: Array<Record<string, unknown>> | null,
    experience: Array<Record<string, unknown>> | null,
    projects: Array<Record<string, unknown>> | null,
    skills: Record<string, string[]> | null,
    tailored: unknown
  ): string
}
