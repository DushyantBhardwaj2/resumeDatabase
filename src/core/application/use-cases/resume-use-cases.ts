import type { Profile, TailoredOutput } from "../../domain/entities"
import type { IProfileRepository, ITailoredResumeRepository } from "../../domain/repositories"
import type { IAIService } from "../ports/ai-service"
import type { IPDFParser } from "../ports/pdf-parser"
import type { ILatexTemplateFiller } from "../ports/latex-compiler"
import { z } from "zod"

export const parsedResumeSchema = z.object({
  contact: z.object({
    phone: z.string().nullable(),
    linkedin: z.string().nullable(),
    github: z.string().nullable(),
    portfolio: z.string().nullable(),
  }),
  education: z.array(
    z.object({ school: z.string(), degree: z.string(), gpa: z.string().nullable(), startYear: z.number().nullable(), endYear: z.number().nullable() })
  ),
  experience: z.array(
    z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), bullets: z.array(z.string()) })
  ),
  projects: z.array(
    z.object({ title: z.string(), techStack: z.array(z.string()), bullets: z.array(z.string()), url: z.string().nullable() })
  ),
  skills: z.object({ languages: z.array(z.string()), frameworks: z.array(z.string()), tools: z.array(z.string()) }),
})

const tailorOutputSchema = z.object({
  summary: z.string().nullable(),
  experience: z.array(
    z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), bullets: z.array(z.string()) })
  ),
  projects: z.array(
    z.object({ title: z.string(), techStack: z.array(z.string()), bullets: z.array(z.string()), url: z.string().nullable() })
  ),
  skills: z.object({ languages: z.array(z.string()), frameworks: z.array(z.string()), tools: z.array(z.string()) }),
})

const PARSE_PROMPT = `You are a precise resume data extractor. Extract the following fields from the resume text and return ONLY valid JSON matching the schema. If a field is missing from the resume, use null for scalar fields and empty arrays for list fields. Return ONLY the raw JSON object — no markdown, no code fences, no explanation, no surrounding text.

Expected JSON structure:
{
  "contact": { "phone": string | null, "linkedin": string | null, "github": string | null, "portfolio": string | null },
  "education": [{ "school": string, "degree": string, "gpa": string | null, "startYear": number | null, "endYear": number | null }],
  "experience": [{ "company": string, "role": string, "startDate": string | null, "endDate": string | null, "bullets": string[] }],
  "projects": [{ "title": string, "techStack": string[], "bullets": string[], "url": string | null }],
  "skills": { "languages": string[], "frameworks": string[], "tools": string[] }
}`

const TAILOR_PROMPT = `You are an expert resume tailoring assistant. Your job is to tailor a candidate's profile to match a specific job description.

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

export class ResumeUseCases {
  constructor(
    private profileRepo: IProfileRepository,
    private tailorRepo: ITailoredResumeRepository,
    private aiService: IAIService,
    private pdfParser: IPDFParser,
    private latexTemplate: ILatexTemplateFiller
  ) {}

  async parseResume(buffer: Buffer): Promise<{ rawText: string; parsed: Profile }> {
    const rawText = await this.pdfParser.extractText(buffer)
    const parsed = await this.aiService.generateStructuredData(PARSE_PROMPT, rawText, parsedResumeSchema)
    return { rawText, parsed: parsed as unknown as Profile }
  }

  async tailorResume(
    userId: string,
    input: { jobTitle: string; company: string; jobDescription: string }
  ): Promise<{ jobTitle: string; company: string; original: Profile; tailored: TailoredOutput; latex: string }> {
    const profile = await this.profileRepo.findByUserId(userId)
    if (!profile) throw new Error("Profile not found. Complete onboarding first.")

    const userContent = JSON.stringify({ ...input, candidateProfile: profile })
    const tailored = await this.aiService.generateStructuredData(TAILOR_PROMPT, userContent, tailorOutputSchema)

    const latex = this.latexTemplate.fill(
      profile.contact as unknown as Record<string, unknown>,
      profile.education as unknown as Array<Record<string, unknown>>,
      profile.experience as unknown as Array<Record<string, unknown>>,
      profile.projects as unknown as Array<Record<string, unknown>>,
      profile.skills as unknown as Record<string, string[]>,
      tailored
    )

    await this.tailorRepo.create({
      userId,
      companyName: input.company,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      tailoredData: { jobTitle: input.jobTitle, company: input.company, original: profile, tailored, latex },
    })

    return { jobTitle: input.jobTitle, company: input.company, original: profile, tailored, latex }
  }
}
