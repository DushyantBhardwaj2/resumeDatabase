import { generateStructuredData } from "./ai"
import { PDFParse } from "pdf-parse"
import { z } from "zod"

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = new PDFParse({ data: buffer })
  const result = await pdf.getText()
  await pdf.destroy()
  return result.text
}

export const parsedResumeSchema = z.object({
  contact: z.object({
    phone: z.string().nullable(),
    linkedin: z.string().nullable(),
    github: z.string().nullable(),
    portfolio: z.string().nullable(),
  }),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      gpa: z.string().nullable(),
      startYear: z.number().nullable(),
      endYear: z.number().nullable(),
    })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      bullets: z.array(z.string()),
    })
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      techStack: z.array(z.string()),
      bullets: z.array(z.string()),
      url: z.string().nullable(),
    })
  ),
  skills: z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    tools: z.array(z.string()),
  }),
})

export type ParsedResume = z.infer<typeof parsedResumeSchema>

const parsePrompt = `You are a precise resume data extractor. Extract the following fields from the resume text and return ONLY valid JSON matching the schema. If a field is missing from the resume, use null for scalar fields and empty arrays for list fields. Return ONLY the raw JSON object — no markdown, no code fences, no explanation, no surrounding text.

Expected JSON structure:
{
  "contact": { "phone": string | null, "linkedin": string | null, "github": string | null, "portfolio": string | null },
  "education": [{ "school": string, "degree": string, "gpa": string | null, "startYear": number | null, "endYear": number | null }],
  "experience": [{ "company": string, "role": string, "startDate": string | null, "endDate": string | null, "bullets": string[] }],
  "projects": [{ "title": string, "techStack": string[], "bullets": string[], "url": string | null }],
  "skills": { "languages": string[], "frameworks": string[], "tools": string[] }
}`

export async function parseResumePdf(
  buffer: Buffer
): Promise<{ rawText: string; parsed: ParsedResume }> {
  const rawText = await extractTextFromPdf(buffer)
  const parsed = await generateStructuredData(
    parsePrompt,
    rawText,
    parsedResumeSchema
  )
  return { rawText, parsed }
}
