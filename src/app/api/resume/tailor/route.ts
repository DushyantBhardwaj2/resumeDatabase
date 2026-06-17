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
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Tailor error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
