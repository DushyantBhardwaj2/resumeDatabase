import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 })
    }

    return Response.json({
      contact: profile.contact,
      education: profile.education,
      experience: profile.experience,
      projects: profile.projects,
      skills: profile.skills,
      githubUsername: profile.githubUsername,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Profile GET error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(body.contact !== undefined && { contact: body.contact }),
        ...(body.education !== undefined && { education: body.education }),
        ...(body.experience !== undefined && { experience: body.experience }),
        ...(body.projects !== undefined && { projects: body.projects }),
        ...(body.skills !== undefined && { skills: body.skills }),
        ...(body.githubUsername !== undefined && { githubUsername: body.githubUsername }),
      },
      create: {
        userId: session.user.id,
        contact: body.contact ?? {},
        education: body.education ?? [],
        experience: body.experience ?? [],
        projects: body.projects ?? [],
        skills: body.skills ?? {},
        githubUsername: body.githubUsername ?? null,
      },
    })

    return Response.json({
      contact: profile.contact,
      education: profile.education,
      experience: profile.experience,
      projects: profile.projects,
      skills: profile.skills,
      githubUsername: profile.githubUsername,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Profile PUT error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
