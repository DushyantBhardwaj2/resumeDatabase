import { getServerSession, fetchWithSession } from "@/config/api-client-server"
import { redirect } from "next/navigation"

export default async function AuthRedirectPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  let error: string | string[] | undefined;
  if (props.searchParams) {
    const sp = await props.searchParams;
    error = sp?.error;
  }

  if (error) {
    console.error("Auth redirect error:", error)
    redirect("/?error=" + encodeURIComponent(String(error)))
  }

  const session = await getServerSession()
  if (!session) {
    redirect("/")
  }

  let profile = null
  try {
    const res = await fetchWithSession('/api/protected/profile')
    if (res.ok) profile = await res.json()
  } catch (e) {
    console.error("Failed to fetch profile:", e)
  }

  if (profile) {
    redirect("/dashboard")
  }

  let hasPassword = true
  try {
    const res = await fetchWithSession('/api/protected/auth/password-status')
    if (res.ok) {
      const data = await res.json()
      hasPassword = data.hasPassword
    }
  } catch (e) {
    console.error("Failed to check password status:", e)
  }

  if (!hasPassword) {
    redirect("/auth/setup-password")
  }

  redirect("/onboarding")
}
