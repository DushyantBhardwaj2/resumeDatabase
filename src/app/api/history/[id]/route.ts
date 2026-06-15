import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const resume = await prisma.tailoredResume.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!resume) {
      return Response.json({ error: "Resume not found" }, { status: 404 })
    }

    return Response.json(resume)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("History get error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const resume = await prisma.tailoredResume.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!resume) {
      return Response.json({ error: "Resume not found" }, { status: 404 })
    }

    await prisma.tailoredResume.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("History delete error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
