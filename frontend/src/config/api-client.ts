export const getApiUrl = () => typeof window !== "undefined" ? "" : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")

export function fetchApi(endpoint: string, options: RequestInit = {}) {
  return fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    credentials: "include"
  })
}

