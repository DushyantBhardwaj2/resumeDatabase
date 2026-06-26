import type { IAIService, ISchema } from "../ports/ai-service"
import type { Profile, VaultBullet } from "../../domain/entities"
import type {
  ChatInteractRequest,
  ChatInteractResponse,
  ChatMessage,
  VaultExpansionRequest,
  VaultExpansionResponse,
  BulletSelectionRequest,
  BulletSelectionResponse,
  ChatIntent,
  TargetWidget,
} from "../ports/chat-types"

// ── Zod schemas for AI response validation ───────────────────────────────────

import { z } from "zod"

const chatInteractAISchema = z.object({
  intent: z.enum(["PROVIDE_DATA", "NAVIGATE", "GENERAL_CHAT"]),
  targetWidget: z.enum([
    "CONTACT", "EXPERIENCE", "PROJECTS", "SKILLS", "CERTIFICATES", "REVIEW", "UPLOAD_DROPZONE",
  ]).nullable().default(null),
  reply: z.string(),
  extractedData: z.record(z.string(), z.unknown()).optional().default({}),
})

const vaultExpandAISchema = z.object({
  vaultBullets: z.array(z.object({
    id: z.string(),
    text: z.string(),
    category: z.enum(["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]).optional(),
    keywords: z.array(z.string()).default([]),
    isAIGenerated: z.boolean().default(true),
  })),
})

const bulletSelectAISchema = z.object({
  selections: z.record(z.string(), z.array(z.string())),
  rationale: z.string(),
})

// ── Schema wrappers implementing ISchema ──────────────────────────────────────

function makeSchema<T>(schema: z.ZodType<T>): ISchema<T> {
  return { parse: (data: unknown) => schema.parse(data) }
}

// ── Use Case ──────────────────────────────────────────────────────────────────

export class ChatUseCases {
  constructor(
    private aiService: IAIService,
    private chatIntentPrompt: string,
    private vaultExpanderPrompt: string,
    private bulletSelectorPrompt: string
  ) {}

  async parseIntent(
    request: ChatInteractRequest
  ): Promise<ChatInteractResponse> {
    const systemPrompt = `${this.chatIntentPrompt}\n\nThe user is currently in phase: ${request.currentState?.phase ?? "GREETING"}.`
    const messagesForAI = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n")

    try {
      const result = await this.aiService.generateStructuredData(
        systemPrompt,
        messagesForAI,
        makeSchema(chatInteractAISchema)
      )
      return {
        reply: result.reply,
        intent: result.intent as ChatIntent,
        targetWidget: result.targetWidget as TargetWidget,
        extractedData: result.extractedData,
      }
    } catch {
      return {
        reply: "I didn't quite catch that. Can you rephrase?",
        intent: "GENERAL_CHAT",
        targetWidget: null,
        extractedData: {},
      }
    }
  }

  async expandVault(request: VaultExpansionRequest): Promise<VaultExpansionResponse> {
    const userContent = `Type: ${request.type}\nTitle: ${request.title}\nDescription: ${request.rawDescription}`
    const result = await this.aiService.generateStructuredData(
      this.vaultExpanderPrompt,
      userContent,
      makeSchema(vaultExpandAISchema)
    )
    return { vaultBullets: result.vaultBullets }
  }

  async selectBullets(request: BulletSelectionRequest): Promise<BulletSelectionResponse> {
    const userContent = JSON.stringify({
      jobDescription: request.jobDescription,
      profile: request.profile,
    })
    const result = await this.aiService.generateStructuredData(
      this.bulletSelectorPrompt,
      userContent,
      makeSchema(bulletSelectAISchema)
    )
    return {
      selections: result.selections,
      rationale: result.rationale,
    }
  }
}
