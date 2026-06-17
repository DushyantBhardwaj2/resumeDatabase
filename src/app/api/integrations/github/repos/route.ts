import { getServerSession } from "@/config/auth"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    if (!username) {
      return Response.json({ error: "username query parameter is required" }, { status: 400 })
    }

    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "resumint-app/1.0",
        },
      }
    )

    if (res.status === 404) {
      return Response.json({ error: "GitHub user not found" }, { status: 404 })
    }

    if (res.status === 403) {
      return Response.json({ error: "GitHub API rate limit exceeded. Try again later." }, { status: 429 })
    }

    if (!res.ok) {
      return Response.json({ error: "GitHub API error" }, { status: res.status })
    }

    const repos: Array<{
      name: string
      description: string | null
      html_url: string
      language: string | null
      stargazers_count: number
      fork: boolean
    }> = await res.json()

    const filtered = repos
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
      }))

    return Response.json({ repos: filtered })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("GitHub repos error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
