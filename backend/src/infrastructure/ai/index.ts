import { logger } from '@/infrastructure/logger'
import type { IAIService, ISchema } from "../../core/application/ports/ai-service"

export class OpenCodeZenAIService implements IAIService {
  async generateStructuredData<T>(systemPrompt: string, userContent: string, schema: ISchema<T>): Promise<T> {
    const apiKey = process.env.OPENCODE_API_KEY
    if (!apiKey) {
      throw new Error("Missing OPENCODE_API_KEY environment variable. AI features are unavailable.")
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90_000)

    try {
      const response = await fetch("https://opencode.ai/zen/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash-free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
          ],
          temperature: 0
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `AI API error: ${response.status}`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage += ` - ${errorJson.error?.message || errorJson.message || errorText}`
        } catch {
          errorMessage += ` - ${errorText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.choices?.[0]?.message?.content) {
        logger.error({ data }, 'Unexpected AI response format')
        throw new Error("Invalid response format from AI service.")
      }

      const text = data.choices[0].message.content
      const jsonStr = extractJson(text)
      try {
        const parsed = JSON.parse(jsonStr)
        return schema.parse(parsed)
      } catch (e) {
        logger.error({ text, jsonStr, err: e }, 'Failed to parse AI JSON')
        throw new Error("AI returned invalid data format. Please try again.")
      }
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException
        ? err.name === 'AbortError'
        : (err as Error)?.name === 'AbortError'
      if (isAbort) {
        throw new Error("AI request timed out after 30 seconds. Please try again with a shorter job description.")
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }
}

export function extractBalanced(text: string, open: string, close: string): string | null {
  let depth = 0
  let start = -1
  let inString = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"' && (i === 0 || text[i - 1] !== '\\')) {
      inString = !inString
      continue
    }
    if (!inString) {
      if (ch === open) {
        if (depth === 0) start = i
        depth++
      } else if (ch === close) {
        depth--
        if (depth === 0 && start !== -1) {
          return text.slice(start, i + 1)
        }
      }
    }
  }
  return null
}

export function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    const candidate = codeBlockMatch[1].trim()
    const fromBraces = extractBalanced(candidate, "{", "}")
    if (fromBraces) return fromBraces
    const fromBrackets = extractBalanced(candidate, "[", "]")
    if (fromBrackets) return fromBrackets
    return candidate
  }

  const fromBraces = extractBalanced(text, "{", "}")
  if (fromBraces) return fromBraces

  const fromBrackets = extractBalanced(text, "[", "]")
  if (fromBrackets) return fromBrackets

  return text.trim()
}
