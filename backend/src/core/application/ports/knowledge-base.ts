export type KBFileCategory = "prompt" | "rule" | "example" | "quality"

export interface KBFile {
  path: string
  content: string
  category: KBFileCategory
}

export interface KnowledgeBundle {
  version: string
  files: KBFile[]
  loadedAt: string
}

export interface IKnowledgeBaseService {
  getCurrentVersion(): string
  getVersions(): string[]
  getBundle(): KnowledgeBundle
  getContext(intent: string): { version: string; files: KBFile[] }
  getPrompt(name: string): string | undefined
}
