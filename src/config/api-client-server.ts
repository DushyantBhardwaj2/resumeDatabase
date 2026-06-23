import { headers as nextHeaders } from "next/headers"

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export async function fetchWithSession(endpoint: string, options: RequestInit = {}) {
  const h = await nextHeaders()
  const cookie = h.get("cookie") || ""
  
  return fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      cookie,
      "Content-Type": "application/json"
    }
  })
}
