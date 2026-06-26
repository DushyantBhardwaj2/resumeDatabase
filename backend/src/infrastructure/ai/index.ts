import type { IAIService, ISchema } from "../../core/application/ports/ai-service"

export class OpenCodeZenAIService implements IAIService {
  async generateStructuredData<T>(systemPrompt: string, userContent: string, schema: ISchema<T>): Promise<T> {
    const apiKey = process.env.OPENCODE_API_KEY
    if (!apiKey) {
      throw new Error("Missing OPENCODE_API_KEY environment variable. AI features are unavailable.")
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50_000)

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
        console.error("Unexpected AI response format:", data)
        throw new Error("Invalid response format from AI service.")
      }

      const text = data.choices[0].message.content
      const jsonStr = extractJson(text)
      try {
        const parsed = JSON.parse(jsonStr)
        return schema.parse(parsed)
      } catch (e) {
        console.error("Failed to parse AI JSON:", { text, jsonStr, error: e })
        throw new Error("AI returned invalid data format. Please try again.")
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error("AI request timed out after 50 seconds. Please try again with a shorter job description.")
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }
}

function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return match[1].trim()
  const braceStart = text.indexOf("{")
  const braceEnd = text.lastIndexOf("}")
  const bracketStart = text.indexOf("[")
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1)
  }
  if (bracketStart !== -1) {
    const bracketEnd = text.lastIndexOf("]")
    if (bracketEnd > bracketStart) return text.slice(bracketStart, bracketEnd + 1)
  }
  return text.trim()
}
