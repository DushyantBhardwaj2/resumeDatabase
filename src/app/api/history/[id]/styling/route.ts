import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { NextRequest } from "next/server"

const styleSchema = z.object({
  template: z.enum(["minimalist", "classic", "tech"]).optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  sectionSpacing: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = styleSchema.safeParse(body)

    if (!validation.success) {
      return Response.json(
        { error: "Invalid style config", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const existing = await prisma.tailoredResume.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return Response.json({ error: "Resume not found" }, { status: 404 })
    }

    const currentStyle = existing.styleConfig as Record<string, string> | null
    const mergedStyle = { ...currentStyle, ...validation.data }

    await prisma.tailoredResume.update({
      where: { id },
      data: { styleConfig: mergedStyle },
    })

    return Response.json({ styleConfig: mergedStyle })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Styling update error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
