import type { ProfileData, VaultBullet } from './profile-types'

function genId(): string {
  return crypto.randomUUID()
}

function normalizeBullets(bullets: unknown): VaultBullet[] {
  if (!bullets || !Array.isArray(bullets) || bullets.length === 0) return []
  if (typeof bullets[0] === 'object' && bullets[0] !== null && 'id' in bullets[0]) {
    return (bullets as VaultBullet[]).map((b) => ({
      ...b,
      id: b.id || genId(),
      keywords: Array.isArray(b.keywords) ? b.keywords : [],
      isAIGenerated: b.isAIGenerated ?? false,
    }))
  }
  return (bullets as string[]).map((b) => ({
    id: genId(),
    text: b,
    keywords: [],
    isAIGenerated: false,
  }))
}

export function normalizeProfile(raw: unknown): ProfileData {
  if (!raw || typeof raw !== 'object') return getEmptyProfile()

  const r = raw as Record<string, unknown>

  const contact = r.contact as Record<string, unknown> | undefined
  const education = r.education
  const experience = r.experience
  const projects = r.projects
  const skills = r.skills as Record<string, unknown> | undefined
  const certificates = r.certificates
  const githubUsername = r.githubUsername

  return {
    contact: {
      name: typeof contact?.name === 'string' ? contact.name : '',
      email: typeof contact?.email === 'string' ? contact.email : '',
      phone: typeof contact?.phone === 'string' ? contact.phone : '',
      linkedin: typeof contact?.linkedin === 'string' ? contact.linkedin : '',
      github: typeof contact?.github === 'string' ? contact.github : '',
      leetcode: typeof contact?.leetcode === 'string' ? contact.leetcode : '',
      portfolio: typeof contact?.portfolio === 'string' ? contact.portfolio : '',
    },
    education: normalizeEducation(education),
    experience: normalizeExperienceArray(experience),
    projects: normalizeProjectArray(projects),
    skills: {
      languages: Array.isArray(skills?.languages) ? skills!.languages : [],
      frameworks: Array.isArray(skills?.frameworks) ? skills!.frameworks : [],
      tools: Array.isArray(skills?.tools) ? skills!.tools : [],
    },
    certificates: normalizeCertificates(certificates),
    githubUsername: typeof githubUsername === 'string' ? githubUsername : '',
  }
}

function normalizeEducation(edu: unknown): ProfileData['education'] {
  if (!edu) return []
  if (Array.isArray(edu)) {
    return edu.map((e) => ({
      school: typeof e.school === 'string' ? e.school : '',
      degree: typeof e.degree === 'string' ? e.degree : '',
      gpa: typeof e.gpa === 'string' ? e.gpa : '',
      startYear: typeof e.startYear === 'string' ? e.startYear : String(e.startYear ?? ''),
      endYear: typeof e.endYear === 'string' ? e.endYear : String(e.endYear ?? ''),
    }))
  }
  if (typeof edu === 'object' && edu !== null) {
    const e = edu as Record<string, unknown>
    return [{
      school: typeof e.school === 'string' ? e.school : typeof e.university === 'string' ? e.university : '',
      degree: typeof e.degree === 'string' ? e.degree : '',
      gpa: typeof e.gpa === 'string' ? e.gpa : typeof e.grade === 'string' ? e.grade : '',
      startYear: typeof e.startYear === 'string' ? e.startYear : String(e.startYear ?? ''),
      endYear: typeof e.endYear === 'string' ? e.endYear : String(e.endYear ?? ''),
    }]
  }
  return []
}

function normalizeExperienceArray(exp: unknown): ProfileData['experience'] {
  if (!exp || !Array.isArray(exp)) return []
  return exp.map((e) => ({
    id: typeof e.id === 'string' ? e.id : genId(),
    company: typeof e.company === 'string' ? e.company : '',
    role: typeof e.role === 'string' ? e.role : '',
    startDate: typeof e.startDate === 'string' ? e.startDate : '',
    endDate: typeof e.endDate === 'string' ? e.endDate : '',
    current: e.current === true,
    vaultBullets: normalizeBullets(e.vaultBullets ?? e.bullets),
  }))
}

function normalizeProjectArray(proj: unknown): ProfileData['projects'] {
  if (!proj || !Array.isArray(proj)) return []
  return proj.map((p) => ({
    id: typeof p.id === 'string' ? p.id : genId(),
    title: typeof p.title === 'string' ? p.title : '',
    url: typeof p.url === 'string' ? p.url : '',
    techStack: normalizeTechStack(p.techStack),
    vaultBullets: normalizeBullets(p.vaultBullets ?? p.bullets),
  }))
}

function normalizeTechStack(ts: unknown): string[] {
  if (!ts) return []
  if (Array.isArray(ts)) return ts.map(String)
  if (typeof ts === 'string') return ts.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

function normalizeCertificates(certs: unknown): ProfileData['certificates'] {
  if (!certs || !Array.isArray(certs)) return []
  return certs.map((c) => ({
    id: typeof c.id === 'string' ? c.id : genId(),
    name: typeof c.name === 'string' ? c.name : '',
    issuer: typeof c.issuer === 'string' ? c.issuer : '',
    url: typeof c.url === 'string' ? c.url : '',
    date: typeof c.date === 'string' ? c.date : undefined,
  }))
}

export function getEmptyProfile(): ProfileData {
  return {
    contact: { name: '', email: '', phone: '', linkedin: '', github: '', leetcode: '', portfolio: '' },
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], frameworks: [], tools: [] },
    certificates: [],
    githubUsername: '',
  }
}

export function countSectionItems(data: ProfileData): Record<string, number> {
  return {
    contact: data.contact.name || data.contact.email || data.contact.phone ? 1 : 0,
    education: data.education.length,
    experience: data.experience.length,
    projects: data.projects.length,
    skills: data.skills.languages.length + data.skills.frameworks.length + data.skills.tools.length,
    certificates: data.certificates.length,
  }
}
