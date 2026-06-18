import { getServerSession } from "@/config/auth"
import { redirect } from "next/navigation"
import { container } from "@/di/container"

export default async function AuthRedirectPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/")
  }

  const profile = await container.profileUseCases.getProfile(session.user.id)

  if (profile) {
    redirect("/dashboard")
  }

  redirect("/onboarding")
}
