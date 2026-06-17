export interface ILatexCompiler {
  compile(latex: string): Promise<Buffer>
}

export interface ILatexTemplateFiller {
  fill(
    contact: Record<string, unknown>,
    education: Array<Record<string, unknown>>,
    experience: Array<Record<string, unknown>>,
    projects: Array<Record<string, unknown>>,
    skills: Record<string, string[]>,
    tailored: unknown
  ): string
}
