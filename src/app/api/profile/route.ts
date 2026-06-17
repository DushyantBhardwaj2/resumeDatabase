import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { NextRequest } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const profile = await container.profileUseCases.getProfile(session.user.id)
    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 })

    return Response.json(profile)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Profile GET error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const profile = await container.profileUseCases.updateProfile(session.user.id, body)

    return Response.json(profile)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Profile PUT error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
