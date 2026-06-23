import type { SectionType } from "../../domain/entities"
import type { Profile, TailoredOutput } from "../../domain/entities"

export interface GenerateBulletsInput {
  section: SectionType
  rawInput: string
  context?: Record<string, unknown>
}

export interface GenerateBulletsOutput {
  bullets?: string[]
  languages?: string[]
  frameworks?: string[]
  tools?: string[]
  summary?: string
  title?: string
  url?: string | null
  techStack?: string[]
  bulletPoints?: string[]
  company?: string
  role?: string
  startDate?: string | null
  endDate?: string | null
}

export interface ParseResumeInput {
  buffer: Buffer
}

export interface ParseResumeOutput {
  rawText: string
  parsed: Profile
}

export interface SaveProfileInput {
  rawText: string
  parsed: Profile
}

export interface TailorResumeInput {
  jobTitle: string
  company: string
  jobDescription: string
}

export interface TailorResumeOutput {
  jobTitle: string
  company: string
  original: Profile
  tailored: TailoredOutput
  latex: string
}

export interface ImportGitHubReposInput {
  repos: Array<{ name: string; url: string; language: string | null }>
}

export interface CompileLatexInput {
  latex: string
}
