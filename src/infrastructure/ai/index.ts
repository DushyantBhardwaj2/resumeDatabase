import type { IAIService, ISchema } from "../../core/application/ports/ai-service"

export class OpenCodeZenAIService implements IAIService {
  async generateStructuredData<T>(systemPrompt: string, userContent: string, schema: ISchema<T>): Promise<T> {
    const response = await fetch("https://opencode.ai/zen/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENCODE_API_KEY}`
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
      throw new Error(`AI API error: ${response.status} ${await response.text()}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content
    const jsonStr = extractJson(text)
    const parsed = JSON.parse(jsonStr)
    return schema.parse(parsed)
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
