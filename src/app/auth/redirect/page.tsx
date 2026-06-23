import { getServerSession } from "@/config/auth"
import { redirect } from "next/navigation"
import { container } from "@/di/container"

export default async function AuthRedirectPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const searchParams = await props.searchParams
  const error = searchParams?.error

  if (error) {
    console.error("Auth redirect error:", error)
    redirect("/?error=" + encodeURIComponent(String(error)))
  }

  const session = await getServerSession()
  if (!session) {
    redirect("/")
  }

  let profile: import("@/core/domain/entities").Profile | null = null
  try {
    profile = await container.profileUseCases.getProfile(session.user.id)
  } catch (e) {
    console.error("Failed to fetch profile:", e)
  }

  if (profile) {
    redirect("/dashboard")
  }

  redirect("/onboarding")
}
