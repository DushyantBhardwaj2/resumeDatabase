export type VaultBullet = {
  id: string
  text: string
  category?: 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'LEADERSHIP' | 'GENERAL'
  keywords: string[]
  isAIGenerated: boolean
}

export type Contact = {
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
  leetcode: string
  portfolio: string
}

export type Education = {
  school: string
  degree: string
  gpa: string
  startYear: string
  endYear: string
}

export type Experience = {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string
  current: boolean
  vaultBullets: VaultBullet[]
}

export type Project = {
  id: string
  title: string
  url: string
  techStack: string[]
  vaultBullets: VaultBullet[]
}

export type Skills = {
  languages: string[]
  frameworks: string[]
  tools: string[]
}

export type Certificate = {
  id: string
  name: string
  issuer: string
  url: string
  date?: string
}

export type ProfileData = {
  contact: Contact
  education: Education[]
  experience: Experience[]
  projects: Project[]
  skills: Skills
  certificates: Certificate[]
  githubUsername: string
}

export type SectionName = 'contact' | 'education' | 'experience' | 'projects' | 'skills' | 'certificates'

export const SECTION_LABELS: Record<SectionName, string> = {
  contact: 'Contact Info',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  certificates: 'Certificates',
}

export const SECTION_ORDER: SectionName[] = [
  'contact',
  'education',
  'experience',
  'projects',
  'skills',
  'certificates',
]
