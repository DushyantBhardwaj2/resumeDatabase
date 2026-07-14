import type { IKnowledgeBaseService, KnowledgeBundle, KBFile } from "../core/application/ports/knowledge-base"
import { CHAT_INTENT_PARSER, MEMORY_EXTRACT, PARSE_RESUME, BULLET_SELECTOR, VAULT_EXPANDER } from "./prompts"

export class KnowledgeBaseService implements IKnowledgeBaseService {
  private bundle: KnowledgeBundle

  constructor() {
    const files: KBFile[] = [
      {
        path: "prompts/chat-intent-parser.md",
        category: "prompt",
        content: CHAT_INTENT_PARSER,
      },
      {
        path: "prompts/memory-extract.md",
        category: "prompt",
        content: MEMORY_EXTRACT,
      },
      {
        path: "prompts/parse-resume.md",
        category: "prompt",
        content: PARSE_RESUME,
      },
      {
        path: "prompts/bullet-selector.md",
        category: "prompt",
        content: BULLET_SELECTOR,
      },
      {
        path: "prompts/vault-expander.md",
        category: "prompt",
        content: VAULT_EXPANDER,
      },
      {
        path: "quality/ats-heuristics.md",
        category: "quality",
        content: `ATS Heuristics & Standards:
- Section headings: Use standard names like "Experience", "Projects", "Education", "Skills".
- PDF compatibility: Bullet characters must be standard UTF-8 characters.
- Quantified impact: Every work experience bullet should attempt to state action, method, and metric.`,
      },
      {
        path: "quality/harvard-action-verbs.md",
        category: "quality",
        content: `Strong action verbs to begin resume bullets:
- Leadership: Spearheaded, led, orchestrated, directed, championed, guided.
- Technical: Designed, developed, architected, implemented, engineered, integrated, optimized.
- Business/Operations: Accelerated, maximized, streamlined, generated, delivered.`,
      },
    ]

    this.bundle = {
      version: "v1",
      files,
      loadedAt: new Date().toISOString(),
    }
  }

  getCurrentVersion(): string {
    return "v1"
  }

  getVersions(): string[] {
    return ["v1"]
  }

  getBundle(): KnowledgeBundle {
    return this.bundle
  }

  getContext(intent: string): { version: string; files: KBFile[] } {
    let selectedFiles: KBFile[] = []

    if (intent === "CREATE_MEMORY" || intent === "UPDATE_MEMORY") {
      selectedFiles = this.bundle.files.filter(f =>
        f.path.includes("memory-extract.md") || f.path.includes("vault-expander.md")
      )
    } else if (intent === "CREATE_RESUME") {
      selectedFiles = this.bundle.files.filter(f =>
        f.path.includes("parse-resume.md") || f.path.includes("bullet-selector.md") || f.category === "quality"
      )
    } else if (intent === "GENERAL_CHAT") {
      selectedFiles = this.bundle.files.filter(f =>
        f.path.includes("chat-intent-parser.md")
      )
    }

    return {
      version: "v1",
      files: selectedFiles,
    }
  }

  getPrompt(name: string): string | undefined {
    if (name === "CHAT_INTENT_PARSER") return CHAT_INTENT_PARSER
    if (name === "MEMORY_EXTRACT") return MEMORY_EXTRACT
    if (name === "PARSE_RESUME") return PARSE_RESUME
    if (name === "BULLET_SELECTOR") return BULLET_SELECTOR
    if (name === "VAULT_EXPANDER") return VAULT_EXPANDER
    return undefined
  }
}
