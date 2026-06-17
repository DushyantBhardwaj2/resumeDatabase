import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { z } from "zod"
import { NextRequest } from "next/server"

const requestSchema = z.object({
  section: z.enum(["experience", "projects", "skills", "summary", "project", "experience_entry"]),
  rawInput: z.string().min(1),
  context: z.record(z.string(), z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const validation = requestSchema.safeParse(body)
    if (!validation.success) {
      return Response.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const { section, rawInput, context } = validation.data
    const result = await container.aiUseCases.generate(section, rawInput, context)
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("AI generate-bullets error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
