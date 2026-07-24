import type { IAIService, ISchema } from "../ports/ai-service"
import type { IRetrieverService } from "../ports/retriever"
import type { IKnowledgeBaseService } from "../ports/knowledge-base"
import type { IConfidenceService } from "../ports/system-confidence"
import type { IChatRepository } from "../../domain/repositories"
import type { ChatMessage, ChatIntentV2, ChatInteractRequestV2, ChatInteractResponseV2 } from "../ports/chat-types"
import type { DomainMemoryAction } from "../../domain/entities"
import { intentClassifySchema, memoryExtractSchema } from "./schemas"

function makeSchema<T>(schema: z.ZodType<T>): ISchema<T> {
  return { parse: (data: unknown) => schema.parse(data) }
}

import { z } from "zod"

export class ChatUseCases {
  constructor(
    private aiService: IAIService,
    private retriever: IRetrieverService,
    private kb: IKnowledgeBaseService,
    private confidence: IConfidenceService,
    private chatRepo: IChatRepository,
    private intentPrompt: string,
    private memoryExtractPrompt: string,
  ) { }

  async interact(request: ChatInteractRequestV2, userId: string): Promise<ChatInteractResponseV2> {
    await this.chatRepo.save({ userId, role: "user", content: request.message })

    const intent = await this._classifyIntent(request.message)
    const kbContext = this.kb.getContext(intent.intent as any)

    switch (intent.intent) {
      case "GENERAL_CHAT":
        return this._handleGeneralChat(request.message, userId, kbContext)

      case "CREATE_MEMORY":
        return this._handleCreateMemory(request.message, userId, kbContext)

      case "SEARCH_MEMORY":
        return this._handleSearchMemory(request.message, userId)

      case "CREATE_RESUME":
        return {
          reply: "I'll analyze this job description and prepare your resume. Let me work on that...",
          type: "text",
          intent: "CREATE_RESUME",
        }

      case "UPDATE_MEMORY":
        return {
          reply: "Which entry would you like to update? Please specify the name and the changes.",
          type: "text",
          intent: "UPDATE_MEMORY",
        }

      case "DELETE_MEMORY":
        return {
          reply: "Which entry would you like to delete? Please specify the name.",
          type: "text",
          intent: "DELETE_MEMORY",
        }

      default:
        return {
          reply: "How can I help you with your resume?",
          type: "text",
          intent: "GENERAL_CHAT",
        }
    }
  }

  private async _classifyIntent(message: string): Promise<{ intent: ChatIntentV2; confidence: number; contextHint?: string }> {
    try {
      const result = await this.aiService.generateStructuredData(
        this.intentPrompt,
        message,
        makeSchema(intentClassifySchema)
      )
      return { intent: result.intent, confidence: result.confidence, contextHint: result.contextHint }
    } catch {
      return { intent: "GENERAL_CHAT", confidence: 0.5 }
    }
  }

  private async _handleGeneralChat(message: string, userId: string, kbContext: any): Promise<ChatInteractResponseV2> {
    const systemCtx = kbContext?.files?.map((f: any) => f.content).join("\n") ?? ""
    const reply = await this.aiService.generate(
      `${systemCtx}\n\nBe concise and helpful. The user said: ${message}`,
      { temperature: 0.7, maxTokens: 500 }
    )
    return { reply, type: "text", intent: "GENERAL_CHAT" }
  }

  private async _handleCreateMemory(message: string, userId: string, kbContext: any): Promise<ChatInteractResponseV2> {
    const systemCtx = kbContext?.files?.map((f: any) => f.content).join("\n") ?? ""

    try {
      const result = await this.aiService.generateStructuredData(
        `${systemCtx}\n\nExtract memory entries from the user's message.`,
        message,
        makeSchema(memoryExtractSchema)
      )

      const actions = (result.actions ?? []) as DomainMemoryAction[]

      if (actions.length === 0) {
        return {
          reply: "I couldn't find any details to save. Could you share more about your experience?",
          type: "text",
          intent: "CREATE_MEMORY",
        }
      }

      return {
        reply: `I found ${actions.length} entr${actions.length === 1 ? "y" : "ies"} to save. Please review and confirm.`,
        type: "proposal-cards",
        intent: "CREATE_MEMORY",
        actions,
      }
    } catch {
      return {
        reply: "I'd love to save that. Could you share more details like the company, role, and what you worked on?",
        type: "text",
        intent: "CREATE_MEMORY",
      }
    }
  }

  private async _handleSearchMemory(query: string, userId: string): Promise<ChatInteractResponseV2> {
    const results = await this.retriever.search({
      userId,
      query,
      maxResults: 20,
    })

    if (results.length === 0) {
      return {
        reply: "I couldn't find any matching entries in your career memory.",
        type: "text",
        intent: "SEARCH_MEMORY",
        searchResults: [],
      }
    }

    return {
      reply: `Found ${results.length} matching entr${results.length === 1 ? "y" : "ies"}:`,
      type: "search-results",
      intent: "SEARCH_MEMORY",
      searchResults: results,
    }
  }
}
