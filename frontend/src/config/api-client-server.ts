import { headers as nextHeaders } from "next/headers"

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
