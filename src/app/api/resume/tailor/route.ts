import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStructuredData } from "@/lib/ai"
import { fillLatexTemplate } from "@/lib/latex-template"
import { z } from "zod"
import { NextRequest } from "next/server"

const tailorRequestSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  jobDescription: z.string().min(50),
})

const tailoredBulletSchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
})

const tailoredProjectSchema = z.object({
  title: z.string(),
  techStack: z.array(z.string()),
  bullets: z.array(z.string()),
  url: z.string().nullable(),
})

const tailoredSkillsSchema = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string()),
})

const tailoredOutputSchema = z.object({
  summary: z.string().nullable(),
  experience: z.array(tailoredBulletSchema),
  projects: z.array(tailoredProjectSchema),
  skills: tailoredSkillsSchema,
})

export type TailoredOutput = z.infer<typeof tailoredOutputSchema>

const tailorPrompt = `You are an expert resume tailoring assistant. Your job is to tailor a candidate's profile to match a specific job description.

## RULES (strict — do not violate these):
1. DO NOT invent experiences, projects, or skills that are not present in the candidate's original profile.
2. DO NOT change company names, job titles, degree names, school names, or dates.
3. You MAY rephrase existing bullet points to emphasize skills and accomplishments relevant to the job description.
4. You MAY reorder bullet points within each experience/project to put the most relevant ones first.
5. You MAY reorder the skills categories and remove skills that are irrelevant to the job.
6. You MAY generate a 1-2 sentence professional summary that highlights the candidate's fit for this specific role, based solely on their existing profile.
7. Output ONLY valid JSON matching the schema — no markdown, no code fences, no explanation.

## Expected JSON structure:
{
  "summary": string | null,
  "experience": [{ "company": string, "role": string, "startDate": string | null, "endDate": string | null, "bullets": string[] }],
  "projects": [{ "title": string, "techStack": string[], "bullets": string[], "url": string | null }],
  "skills": { "languages": string[], "frameworks": string[], "tools": string[] }
}`

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = tailorRequestSchema.safeParse(body)
    if (!validation.success) {
      return Response.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 422 }
      )
    }

    const { jobTitle, company: companyName, jobDescription } = validation.data

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return Response.json({ error: "Profile not found. Complete onboarding first." }, { status: 404 })
    }

    const userContent = JSON.stringify({
      jobTitle,
      company: companyName,
      jobDescription,
      candidateProfile: {
        contact: profile.contact,
        education: profile.education,
        experience: profile.experience,
        projects: profile.projects,
        skills: profile.skills,
      },
    })

    const tailored = await generateStructuredData<TailoredOutput>(
      tailorPrompt,
      userContent,
      tailoredOutputSchema
    )

    const originalProfile = {
      contact: profile.contact,
      education: profile.education,
      experience: profile.experience,
      projects: profile.projects,
      skills: profile.skills,
    }

    const result = {
      jobTitle,
      company: companyName,
      original: originalProfile,
      tailored,
      latex: fillLatexTemplate(
        originalProfile.contact as Record<string, unknown> || {},
        (originalProfile.education as Array<Record<string, unknown>>) || [],
        (originalProfile.experience as Array<Record<string, unknown>>) || [],
        (originalProfile.projects as Array<Record<string, unknown>>) || [],
        (originalProfile.skills as Record<string, string[]>) || {},
        tailored
      ),
    }

    await prisma.tailoredResume.create({
      data: {
        userId: session.user.id,
        companyName,
        jobTitle,
        jobDescription,
        tailoredData: result as never,
      },
    })

    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    console.error("Tailor error:", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
