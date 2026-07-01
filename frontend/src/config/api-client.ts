export const getApiUrl = () => typeof window !== "undefined" ? "" : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")

import { hc } from "hono/client"
import type { AppType } from "@backend/index"

export function fetchApi(endpoint: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData
  const headers = new Headers(options.headers)
  
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  })
}

// Hono RPC Browser Client
export const api = hc<AppType>(getApiUrl(), {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    const isFormData = init?.body instanceof FormData
    const headers = new Headers(init?.headers)
    
    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: 'include'
    })
  }
})
