export interface Contact {
  name: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  github: string | null
  leetcode: string | null
  portfolio: string | null
}

export interface Education {
  school: string
  degree: string
  gpa: string | null
  startYear: number | null
  endYear: number | null
}

export interface Experience {
  company: string
  role: string
  startDate: string | null
  endDate: string | null
  bullets: string[]
}

export interface Project {
  title: string
  techStack: string[]
  bullets: string[]
  url: string | null
}

export interface Skills {
  languages: string[]
  frameworks: string[]
  tools: string[]
}

export interface Profile {
  contact: Contact
  education: Education[]
  experience: Experience[]
  projects: Project[]
  skills: Skills
  githubUsername: string | null
}

export interface TailoredOutput {
  summary: string | null
  experience: Experience[]
  projects: Project[]
  skills: Skills
}

export interface GitHubRepoInfo {
  name: string
  description: string | null
  url: string
  language: string | null
  stars: number
}

export interface AiGeneratedProject {
  title: string
  url: string | null
  techStack: string[]
  bulletPoints: string[]
}

export interface AiGeneratedExperience {
  company: string
  role: string
  startDate: string | null
  endDate: string | null
  bulletPoints: string[]
}

export type SectionType = "experience" | "projects" | "skills" | "summary" | "project" | "experience_entry"
