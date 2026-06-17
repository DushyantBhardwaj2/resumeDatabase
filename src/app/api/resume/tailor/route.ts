import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { z } from "zod"
import { NextRequest } from "next/server"

const tailorRequestSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  jobDescription: z.string().min(50),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const validation = tailorRequestSchema.safeParse(body)
    if (!validation.success) {
      return Response.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const result = await container.resumeUseCases.tailorResume(session.user.id, validation.data)
    return Response.json(result)
  } catch (e) {
    console.error("Tailor error:", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    
    let status = 500
    if (message.includes("Profile not found")) status = 404
    if (message.includes("Invalid request") || message.includes("Complete onboarding")) status = 400
    if (message.includes("Unauthorized")) status = 401
    if (message.includes("Missing OPENCODE_API_KEY")) status = 503 // Service Unavailable

    return Response.json({ error: message }, { status })
  }
}
