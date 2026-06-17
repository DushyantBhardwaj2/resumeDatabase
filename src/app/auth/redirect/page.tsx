import { getServerSession } from "@/config/auth"
import { prisma } from "@/config/prisma"
import { redirect } from "next/navigation"

export default async function AuthRedirectPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/")
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (profile) {
    redirect("/dashboard")
  }

  redirect("/onboarding")
}
