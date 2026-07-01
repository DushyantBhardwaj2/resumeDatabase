import { headers as nextHeaders } from "next/headers"
import { hc } from "hono/client"
import type { AppType } from "@backend/index"

const getApiUrl = () => process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export async function fetchWithSession(endpoint: string, options: RequestInit = {}) {
  const h = await nextHeaders()
  const cookie = h.get("cookie") || ""
  
  const isFormData = options.body instanceof FormData
  const merged = new Headers(options.headers)
  merged.set("cookie", cookie)
  if (!isFormData && !merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json")
  }

  return fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers: merged,
  })
}

// Hono RPC Server Client
export const serverApi = hc<AppType>(getApiUrl(), {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const h = await nextHeaders()
    const cookie = h.get("cookie") || ""
    
    const isFormData = init?.body instanceof FormData
    const merged = new Headers(init?.headers)
    merged.set("cookie", cookie)
    if (!isFormData && !merged.has("Content-Type")) {
      merged.set("Content-Type", "application/json")
    }

    return fetch(input, { ...init, headers: merged })
  }
})

export type Session = {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  session: {
    id: string
    expiresAt: Date
  }
} | null

export async function getServerSession(): Promise<Session> {
  try {
    const res = await fetchWithSession('/api/auth/get-session', { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("getServerSession error:", error)
    return null
  }
}

export async function hasProfile(): Promise<boolean> {
  try {
    const res = await serverApi.api.protected.profile.$get()
    if (!res.ok) return false
    const data = await res.json()
    return !!data
  } catch {
    return false
  }
}
