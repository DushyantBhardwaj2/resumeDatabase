export * from "../../shared"

// ── Phase 6: Domain Model Interfaces ───────────────────────────────────────────

export interface DomainExperience {
  id: string
  userId: string
  company: string
  role: string
  startDate: string
  endDate?: string
  current?: boolean
  location?: string
  bullets: DomainBullet[]
  tags: string[]
  source: { type: "PDF_PARSE" | "MANUAL" | "AI_GENERATED" | "GITHUB"; rawMemoryId?: string; importedAt: string; originalText?: string }
  pinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface DomainProject {
  id: string
  userId: string
  title: string
  url?: string
  githubUrl?: string
  readme?: string
  languages: string[]
  topics: string[]
  commitCount?: number
  dependencies: string[]
  techStack: string[]
  bullets: DomainBullet[]
  tags: string[]
  source: { type: "PDF_PARSE" | "MANUAL" | "AI_GENERATED" | "GITHUB"; rawMemoryId?: string; importedAt: string }
  pinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface DomainEducation {
  id: string
  userId: string
  school: string
  degree: string
  field?: string
  gpa?: string
  courses: string[]
  startYear: number
  endYear?: number
  tags: string[]
  pinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface DomainSkill {
  id: string
  userId: string
  name: string
  category: "LANGUAGE" | "FRAMEWORK" | "TOOL" | "PLATFORM" | "CONCEPT"
  proficiency?: "BEGINNER" | "INTERMEDIATE" | "EXPERT"
  tags: string[]
  pinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface DomainCertificate {
  id: string
  userId: string
  name: string
  issuer: string
  url?: string
  date?: string
  tags: string[]
  pinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface DomainAchievement {
  id: string
  userId: string
  title: string
  description: string
  date?: string
  url?: string
  type: "AWARD" | "HACKATHON" | "PUBLICATION" | "VOLUNTEER" | "LEADERSHIP"
  tags: string[]
  pinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface DomainBullet {
  id: string
  text: string
  order: number
  isAIGenerated?: boolean
  parentType: "experience" | "project"
  parentId: string
  createdAt: string
  updatedAt: string
}

export interface DomainRawMemory {
  id: string
  userId: string
  source: "GITHUB_README" | "PDF_UPLOAD" | "CONVERSATION" | "LINKEDIN"
  content: string
  metadata: { repoUrl?: string; fileName?: string; importedAt: string; fileSize?: number; pageCount?: number }
  createdAt: string
}

export type DomainMemoryAction =
  | { type: "CREATE_EXPERIENCE"; experience: Omit<DomainExperience, "id" | "createdAt" | "updatedAt"> }
  | { type: "CREATE_PROJECT"; project: Omit<DomainProject, "id" | "createdAt" | "updatedAt"> }
  | { type: "CREATE_EDUCATION"; education: Omit<DomainEducation, "id"> }
  | { type: "CREATE_SKILL"; skill: Omit<DomainSkill, "id"> }
  | { type: "CREATE_CERTIFICATE"; certificate: Omit<DomainCertificate, "id"> }
  | { type: "CREATE_ACHIEVEMENT"; achievement: Omit<DomainAchievement, "id"> }
  | { type: "UPDATE_ENTRY"; id: string; entryType: string; changes: Record<string, unknown> }
  | { type: "DELETE_ENTRY"; id: string; entryType: string }
  | { type: "MERGE_INTO"; sourceId: string; targetId: string; targetType: string }
