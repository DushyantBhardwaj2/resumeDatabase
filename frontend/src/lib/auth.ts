const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

type Session = {
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

export const auth = {
  api: {
    getSession: async ({ headers: reqHeaders }: { headers: Headers }): Promise<Session> => {
      const cookie = reqHeaders.get("cookie") || ""
      try {
        const res = await fetch(`${API_URL}/api/auth/get-session`, {
          headers: { cookie },
          cache: "no-store",
        })
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    },
    hasProfile: async ({ headers: reqHeaders }: { headers: Headers }): Promise<boolean> => {
      const cookie = reqHeaders.get("cookie") || ""
      try {
        const res = await fetch(`${API_URL}/api/protected/profile`, {
          headers: { cookie },
          cache: "no-store",
        })
        if (!res.ok) return false
        const data = await res.json()
        return !!data
      } catch {
        return false
      }
    }
  },
}
