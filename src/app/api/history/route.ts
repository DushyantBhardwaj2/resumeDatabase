import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase()

    const resumes = await prisma.tailoredResume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        createdAt: true,
      },
    })

    let filtered = resumes
    if (search) {
      filtered = resumes.filter(
        (r) =>
          r.companyName.toLowerCase().includes(search) ||
          r.jobTitle.toLowerCase().includes(search)
      )
    }

    return Response.json({ resumes: filtered })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("History list error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
