import type { IKnowledgeBaseService } from "../ports/knowledge-base"

export class KbUseCases {
  constructor(private kb: IKnowledgeBaseService) {}

  getVersionInfo() {
    return {
      current: this.kb.getCurrentVersion(),
      versions: this.kb.getVersions(),
    }
  }

  getBundle() {
    return this.kb.getBundle()
  }

  getPrompt(name: string) {
    return this.kb.getPrompt(name)
  }
}
