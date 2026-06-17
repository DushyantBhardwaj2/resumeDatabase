import { NextRequest } from "next/server"
import { container } from "@/di/container"

export async function POST(request: NextRequest) {
  try {
    const { latex } = await request.json()
    if (!latex || typeof latex !== "string") {
      return Response.json({ error: "Missing 'latex' field" }, { status: 422 })
    }

    const pdf = await container.latexCompiler.compile(latex)

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=resume.pdf",
      },
    })
  } catch (e) {
    console.error("Compile error:", e)
    return Response.json({ error: "Failed to compile LaTeX" }, { status: 500 })
  }
}
