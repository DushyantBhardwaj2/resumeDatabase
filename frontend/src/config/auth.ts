import { headers as nextHeaders } from "next/headers"

export async function getServerSession() {
  try {
    const h = await nextHeaders()
    const cookie = h.get("cookie") || ""
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    const res = await fetch(`${apiUrl}/api/auth/get-session`, {
      headers: { cookie },
      cache: 'no-store'
    })
    
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("getServerSession error:", error)
    return null
  }
}
