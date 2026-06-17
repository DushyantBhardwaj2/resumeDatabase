import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { parsedResumeSchema } from "@/core/application/use-cases/resume-use-cases"
import type { Profile } from "@/core/domain/entities"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const validation = parsedResumeSchema.safeParse(body.parsed)
    if (!validation.success) {
      return Response.json(
        { error: "Invalid profile data", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const profile = await container.profileUseCases.saveFromOnboarding(session.user.id, body.rawText || "", validation.data as unknown as Profile)
    return Response.json({ profile })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Profile save error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
