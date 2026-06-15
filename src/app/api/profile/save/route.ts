import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parsedResumeSchema } from "@/lib/validators"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = parsedResumeSchema.safeParse(body.parsed)

    if (!validation.success) {
      return Response.json(
        { error: "Invalid profile data", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        rawResumeText: body.rawText || null,
        contact: validation.data.contact,
        education: validation.data.education,
        experience: validation.data.experience,
        projects: validation.data.projects,
        skills: validation.data.skills,
      },
      create: {
        userId: session.user.id,
        rawResumeText: body.rawText || null,
        contact: validation.data.contact,
        education: validation.data.education,
        experience: validation.data.experience,
        projects: validation.data.projects,
        skills: validation.data.skills,
      },
    })

    return Response.json({ profile })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Profile save error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
