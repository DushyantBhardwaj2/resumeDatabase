import type { SectionType } from "../../domain/entities"
import type { IAIService } from "../ports/ai-service"
import { z } from "zod"

const bulletsSchema = z.object({ bullets: z.array(z.string()) })
const skillsSchema = z.object({ languages: z.array(z.string()), frameworks: z.array(z.string()), tools: z.array(z.string()) })
const summarySchema = z.object({ summary: z.string() })
const projectSchema = z.object({ title: z.string(), url: z.string().nullable(), techStack: z.array(z.string()), bulletPoints: z.array(z.string()) })
const experienceEntrySchema = z.object({ company: z.string(), role: z.string(), startDate: z.string().nullable(), endDate: z.string().nullable(), bulletPoints: z.array(z.string()) })

const PROMPTS: Record<string, string> = {
  experience: `You are a resume writing expert. Given raw notes about a person's work experience, generate 3-5 polished, achievement-oriented bullet points.

Rules:
- Start each bullet with a strong action verb.
- Include measurable impact where possible.
- Be concise and professional.
- DO NOT make up specific numbers unless provided in the input.
- Output ONLY valid JSON: { "bullets": string[] }`,

  projects: `You are a resume writing expert. Given raw notes about a person's project, generate 2-4 polished bullet points.

Rules:
- Start each bullet with a strong action verb.
- Highlight technical skills, impact, and outcomes.
- Be concise and professional.
- DO NOT make up specific numbers unless provided in the input.
- Output ONLY valid JSON: { "bullets": string[] }`,

  skills: `You are a resume categorization expert. Given raw notes about a person's skills, organize them into categories: languages, frameworks, and tools.

Rules:
- Categorize each skill appropriately.
- Remove duplicates and generic terms.
- Be precise with technology names.
- Output ONLY valid JSON: { "languages": string[], "frameworks": string[], "tools": string[] }`,

  summary: `You are a resume writing expert. Given raw notes about a person's background, generate a 2-3 sentence professional summary.

Rules:
- Write in first person (implied, no "I").
- Highlight key skills, experience, and career trajectory.
- Be concise and impactful.
- Output ONLY valid JSON: { "summary": string }`,

  experience_entry: `You are an expert technical resume writer. Analyze the user's raw explanation of their work experience and output structured resume data.

Rules:
- Company and role must be professional and accurate.
- Dates can be inferred from context.
- BulletPoints: 3-5 achievement-oriented bullet points. Start each with a strong action verb. Use STAR method.
- Output ONLY valid JSON: { "company": string, "role": string, "startDate": string | null, "endDate": string | null, "bulletPoints": string[] }`,

  project: `You are an expert technical resume writer. Analyze the input (a GitHub link or raw project explanation) and output structured project data.

Rules:
- Title must be concise and professional (not a raw repo name).
- URL is the GitHub/project URL if provided; otherwise null.
- TechStack: 5-7 core technologies max.
- BulletPoints: 3-5 professional resume bullet points. Start each with a strong action verb. Use STAR method where possible.
- Output ONLY valid JSON: { "title": string, "url": string | null, "techStack": string[], "bulletPoints": string[] }`,
}

export class AiUseCases {
  constructor(private aiService: IAIService) {}

  async generate(section: SectionType, rawInput: string, context?: Record<string, unknown>) {
    const prompt = PROMPTS[section]
    if (!prompt) throw new Error(`Unknown section: ${section}`)
    const systemPrompt = `${prompt}\n\nAdditional context: ${JSON.stringify(context ?? {})}`
    const userContent = `Raw input: "${rawInput}"`

    switch (section) {
      case "skills":
        return this.aiService.generateStructuredData(systemPrompt, userContent, skillsSchema)
      case "summary":
        return this.aiService.generateStructuredData(systemPrompt, userContent, summarySchema)
      case "project":
        return this.aiService.generateStructuredData(systemPrompt, userContent, projectSchema)
      case "experience_entry":
        return this.aiService.generateStructuredData(systemPrompt, userContent, experienceEntrySchema)
      default:
        return this.aiService.generateStructuredData(systemPrompt, userContent, bulletsSchema)
    }
  }
}
