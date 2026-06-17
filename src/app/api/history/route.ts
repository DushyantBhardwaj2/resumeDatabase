import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined

    const items = await container.historyUseCases.list(session.user.id, search)
    return Response.json({ items })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("History GET error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
