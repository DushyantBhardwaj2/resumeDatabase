import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const resume = await container.historyUseCases.get(id, session.user.id)
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 })

    return Response.json(resume)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("History GET error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await container.historyUseCases.delete(id, session.user.id)

    return Response.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("History DELETE error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
