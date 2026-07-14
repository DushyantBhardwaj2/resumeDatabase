import type { IRetrieverService, RetrieverSearchOptions, MergeDetection } from "../ports/retriever"
import type { EntrySummary, MemoryType } from "../../../shared"

interface ScorableEntry {
  id: string
  type: MemoryType
  title: string
  keywords: string[]
  techStack: string[]
  tags: string[]
  bulletTexts: string[]
  updatedAt: Date
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s#.+/-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function countMatches(terms: Set<string>, target: string[]): number {
  return target.filter((t) => terms.has(t.toLowerCase())).length
}

export class RetrieverService implements IRetrieverService {
  async search(options: RetrieverSearchOptions): Promise<EntrySummary[]> {
    const { query, types, maxResults = 30, excludeIds = [], contextHint } = options

    const queryTerms = new Set(tokenize(query))
    if (queryTerms.size === 0) return []

    const entries = await this.fetchEntries(options.userId, types)
    const now = Date.now()
    const sixMonthsMs = 180 * 24 * 60 * 60 * 1000

    const scored = entries
      .filter((e) => !excludeIds.includes(e.id))
      .map((entry) => {
        const titleTerms = tokenize(entry.title)
        const tagTerms = entry.keywords.concat(entry.tags).flatMap((t) => tokenize(t))
        const techTerms = entry.techStack.flatMap((t) => tokenize(t))
        const bulletTerms = entry.bulletTexts.flatMap((t) => tokenize(t))

        const titleScore = countMatches(queryTerms, titleTerms) * 1.0
        const tagScore = countMatches(queryTerms, tagTerms) * 0.8
        const techScore = countMatches(queryTerms, techTerms) * 0.7
        const bulletScore = countMatches(queryTerms, bulletTerms) * 0.5

        const ageMs = now - entry.updatedAt.getTime()
        const recencyDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))
        const recencyBonus = ageMs < sixMonthsMs ? 1.2 : 1.0

        let typeBoost = 1.0
        if (contextHint) {
          const hint = contextHint.toLowerCase()
          if ((hint.includes("senior") || hint.includes("lead")) && entry.type === "experience") typeBoost = 1.3
          if (hint.includes("intern") && entry.type === "education") typeBoost = 1.3
        }

        const total = Math.min((titleScore + tagScore + techScore + bulletScore) * recencyBonus * typeBoost, 10.0)

        const bestBullet = entry.bulletTexts.sort((a, b) => b.length - a.length)[0] ?? ""

        return {
          id: entry.id,
          type: entry.type,
          title: entry.title,
          keywords: [...new Set([...entry.keywords, ...entry.tags, ...entry.techStack])],
          bulletSummary: bestBullet.slice(0, 80),
          score: Math.round(total * 10) / 10,
          recencyDays,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)

    return scored
  }

  async detectMerge(newContent: { title: string; description: string; techStack: string[] }): Promise<MergeDetection | null> {
    const queryTerms = new Set(tokenize(newContent.title + " " + newContent.description))
    const techTerms = new Set(newContent.techStack.map((t) => t.toLowerCase()))

    let bestMatch: { id: string; title: string; type: MemoryType; score: number } | null = null

    const existing = await this.fetchAllEntries()
    for (const entry of existing) {
      const entryTitleTerms = new Set(tokenize(entry.title))
      const entryTechTerms = new Set(entry.techStack.map((t) => t.toLowerCase()))

      let overlap = 0
      for (const term of queryTerms) {
        if (entryTitleTerms.has(term)) overlap++
      }
      for (const term of techTerms) {
        if (entryTechTerms.has(term)) overlap++
      }

      const totalUnique = new Set([...queryTerms, ...techTerms, ...entryTitleTerms, ...entryTechTerms]).size
      const score = totalUnique > 0 ? overlap / totalUnique : 0

      if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: entry.id, title: entry.title, type: entry.type, score }
      }
    }

    if (bestMatch) {
      return {
        shouldSuggest: true,
        targetEntry: { id: bestMatch.id, title: bestMatch.title, type: bestMatch.type },
        matchScore: Math.round(bestMatch.score * 100) / 100,
      }
    }

    return null
  }

  private async fetchEntries(userId: string, types?: MemoryType[]): Promise<ScorableEntry[]> {
    const all: ScorableEntry[] = []

    const typeList = types ?? ["experience", "project", "education", "skill", "certificate", "achievement"]

    if (typeList.includes("experience") && this._experienceRepo) {
      const rows = await this._experienceRepo.findByUserId(userId)
      all.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "experience" as MemoryType,
          title: `${r.role} at ${r.company}`,
          keywords: r.tags,
          techStack: [] as string[],
          tags: r.tags,
          bulletTexts: r.bullets.map((b) => b.text),
          updatedAt: new Date(r.updatedAt),
        }))
      )
    }
    if (typeList.includes("project") && this._projectRepo) {
      const rows = await this._projectRepo.findByUserId(userId)
      all.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "project" as MemoryType,
          title: r.title,
          keywords: r.tags,
          techStack: r.techStack,
          tags: r.tags,
          bulletTexts: r.bullets.map((b) => b.text),
          updatedAt: new Date(r.updatedAt),
        }))
      )
    }
    if (typeList.includes("education") && this._educationRepo) {
      const rows = await this._educationRepo.findByUserId(userId)
      all.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "education" as MemoryType,
          title: `${r.degree} at ${r.school}`,
          keywords: r.tags,
          techStack: [] as string[],
          tags: r.tags,
          bulletTexts: [] as string[],
          updatedAt: new Date(r.updatedAt),
        }))
      )
    }
    if (typeList.includes("skill") && this._skillRepo) {
      const rows = await this._skillRepo.findByUserId(userId)
      all.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "skill" as MemoryType,
          title: r.name,
          keywords: r.tags,
          techStack: [] as string[],
          tags: [r.category, ...r.tags],
          bulletTexts: [] as string[],
          updatedAt: new Date(r.updatedAt),
        }))
      )
    }
    if (typeList.includes("certificate") && this._certificateRepo) {
      const rows = await this._certificateRepo.findByUserId(userId)
      all.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "certificate" as MemoryType,
          title: r.name,
          keywords: [r.issuer, ...r.tags],
          techStack: [] as string[],
          tags: r.tags,
          bulletTexts: [] as string[],
          updatedAt: new Date(r.updatedAt),
        }))
      )
    }
    if (typeList.includes("achievement") && this._achievementRepo) {
      const rows = await this._achievementRepo.findByUserId(userId)
      all.push(
        ...rows.map((r) => ({
          id: r.id,
          type: "achievement" as MemoryType,
          title: r.title,
          keywords: [r.type, ...r.tags],
          techStack: [] as string[],
          tags: r.tags,
          bulletTexts: [r.description],
          updatedAt: new Date(r.updatedAt),
        }))
      )
    }

    return all
  }

  private async fetchAllEntries(): Promise<ScorableEntry[]> {
    return []  // merge detection needs full memory access; implemented in use case layer
  }

  constructor(
    private _experienceRepo?: { findByUserId(userId: string): Promise<{ id: string; tags: string[]; bullets: { text: string }[]; role: string; company: string; updatedAt: string }[]> },
    private _projectRepo?: { findByUserId(userId: string): Promise<{ id: string; tags: string[]; techStack: string[]; bullets: { text: string }[]; title: string; updatedAt: string }[]> },
    private _educationRepo?: { findByUserId(userId: string): Promise<{ id: string; tags: string[]; degree: string; school: string; updatedAt: string }[]> },
    private _skillRepo?: { findByUserId(userId: string): Promise<{ id: string; tags: string[]; name: string; category: string; updatedAt: string }[]> },
    private _certificateRepo?: { findByUserId(userId: string): Promise<{ id: string; tags: string[]; name: string; issuer: string; updatedAt: string }[]> },
    private _achievementRepo?: { findByUserId(userId: string): Promise<{ id: string; tags: string[]; title: string; type: string; description: string; updatedAt: string }[]> },
  ) {}
}
