import { getServerSession } from "@/config/auth"
import { container } from "@/di/container"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) return Response.json({ error: "No file provided" }, { status: 400 })
    if (file.type !== "application/pdf") return Response.json({ error: "Only PDF files are accepted" }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return Response.json({ error: "File size exceeds 5MB limit" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const { rawText, parsed } = await container.resumeUseCases.parseResume(buffer)

    return Response.json({ rawText, parsed })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Resume parse error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
