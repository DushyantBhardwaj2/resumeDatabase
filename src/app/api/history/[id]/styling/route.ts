import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { NextRequest } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    await container.historyUseCases.updateStyling(id, session.user.id, body)
    return Response.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Styling PUT error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
