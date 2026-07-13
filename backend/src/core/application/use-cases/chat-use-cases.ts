import { logger } from '@/infrastructure/logger'
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
  intent: z.enum(["PROVIDE_DATA", "NAVIGATE", "GENERAL_CHAT", "GENERATE_PROFILE_DATA"]),
  targetWidget: z.enum([
    "CONTACT", "EXPERIENCE", "PROJECTS", "SKILLS", "CERTIFICATES", "REVIEW", "UPLOAD_DROPZONE", "PROFILE_GENERATOR",
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
  selectedExperienceIds: z.array(z.string()),
  selectedProjectIds: z.array(z.string()),
  selections: z.record(z.string(), z.array(z.string())),
  skills: z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    tools: z.array(z.string()),
  }).optional(),
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
    let messagesForAI = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n")

    // --- NEW LOGIC: URL Interception and Scanning ---
    const lastUserMsg = request.messages.filter((m) => m.role === 'user').pop();
    if (lastUserMsg) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = lastUserMsg.content.match(urlRegex);

      if (urls && urls.length > 0) {
        for (const url of urls) {
          try {
            const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
              headers: { 
                "Accept": "text/plain",
                "X-No-Cache": "true" 
              }
            });
            if (jinaRes.ok) {
              const content = await jinaRes.text();
              const truncated = content.slice(0, 30000); 
              messagesForAI += `\n\n[System Context: The user provided a URL (${url}). Here is its scraped content for you to analyze and generate points from:\n${truncated}]`;
            }
          } catch (error) {
             logger.error({ url, err: error }, 'Failed to fetch URL context');
          }
        }
      }
    }
    // --- END NEW LOGIC ---

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
      selectedExperienceIds: result.selectedExperienceIds ?? [],
      selectedProjectIds: result.selectedProjectIds ?? [],
      selections: result.selections,
      skills: result.skills,
      rationale: result.rationale,
    }
  }
}
