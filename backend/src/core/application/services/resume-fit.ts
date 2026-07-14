import type { IResumeFitService } from "../ports/resume-fit"
import type { ResumeFitScore, JDAnalysis, ResumeSelection } from "../../../shared"

export class ResumeFitService implements IResumeFitService {
  async compute(draftId: string): Promise<ResumeFitScore> {
    const draft = await this._fetchDraft(draftId)
    if (!draft) {
      return { overall: 0, matched: [], missing: [], breakdown: { required: { matched: 0, total: 0, percentage: 0 }, preferred: { matched: 0, total: 0, percentage: 0 } } }
    }

    const jdAnalysis: JDAnalysis = draft.jdAnalysis ?? { role: "", company: "", requiredSkills: [], preferredSkills: [], experienceLevel: "", responsibilities: [], keywords: [] }
    const selections: ResumeSelection[] = draft.selections ?? []

    const selectedEntries = await this._fetchSelectedEntries(draft.userId, selections)

    const entrySkills = new Set<string>()
    for (const entry of selectedEntries) {
      for (const tag of entry.tags) entrySkills.add(tag.toLowerCase())
      if ("techStack" in entry) {
        for (const ts of (entry as any).techStack ?? []) entrySkills.add(ts.toLowerCase())
      }
      if ("bullets" in entry) {
        for (const b of (entry as any).bullets ?? []) {
          for (const word of b.text.toLowerCase().split(/\s+/)) {
            if (word.length > 2) entrySkills.add(word)
          }
        }
      }
    }

    const matchedRequired: { skill: string; source: string }[] = []
    const missingRequired: { skill: string }[] = []
    const matchedPreferred: { skill: string; source: string }[] = []
    const missingPreferred: { skill: string }[] = []

    for (const skill of jdAnalysis.requiredSkills) {
      const key = skill.toLowerCase()
      if (entrySkills.has(key)) {
        matchedRequired.push({ skill, source: "resume" })
      } else {
        missingRequired.push({ skill })
      }
    }

    for (const skill of jdAnalysis.preferredSkills) {
      const key = skill.toLowerCase()
      if (entrySkills.has(key)) {
        matchedPreferred.push({ skill, source: "resume" })
      } else {
        missingPreferred.push({ skill })
      }
    }

    const requiredTotal = jdAnalysis.requiredSkills.length
    const requiredMatched = matchedRequired.length
    const preferredTotal = jdAnalysis.preferredSkills.length
    const preferredMatched = matchedPreferred.length

    const requiredPct = requiredTotal > 0 ? Math.round((requiredMatched / requiredTotal) * 100) : 100
    const preferredPct = preferredTotal > 0 ? Math.round((preferredMatched / preferredTotal) * 100) : 100

    const weightRequired = 0.7
    const weightPreferred = 0.3
    const overall = Math.round(requiredPct * weightRequired + preferredPct * weightPreferred)

    return {
      overall,
      matched: [...matchedRequired, ...matchedPreferred],
      missing: [...missingRequired, ...missingPreferred],
      breakdown: {
        required: { matched: requiredMatched, total: requiredTotal, percentage: requiredPct },
        preferred: { matched: preferredMatched, total: preferredTotal, percentage: preferredPct },
      },
    }
  }

  private async _fetchDraft(draftId: string): Promise<{ userId: string; jdAnalysis?: any; selections?: any } | null> {
    if (this._draftRepo) {
      return this._draftRepo.findById(draftId)
    }
    return null
  }

  private async _fetchSelectedEntries(userId: string, selections: ResumeSelection[]): Promise<Array<{ tags: string[]; [key: string]: any }>> {
    const entries: Array<{ tags: string[]; [key: string]: any }> = []

    for (const sel of selections) {
      switch (sel.entryType) {
        case "experience":
          if (this._experienceRepo) {
            const entry = await this._experienceRepo.findById(sel.entryId)
            if (entry) entries.push(entry)
          }
          break
        case "project":
          if (this._projectRepo) {
            const entry = await this._projectRepo.findById(sel.entryId)
            if (entry) entries.push(entry)
          }
          break
        case "education":
          if (this._educationRepo) {
            const entry = await this._educationRepo.findById(sel.entryId)
            if (entry) entries.push(entry)
          }
          break
      }
    }

    return entries
  }

  constructor(
    private _draftRepo?: { findById(id: string): Promise<any | null> },
    private _experienceRepo?: { findById(id: string): Promise<any | null> },
    private _projectRepo?: { findById(id: string): Promise<any | null> },
    private _educationRepo?: { findById(id: string): Promise<any | null> },
  ) {}
}
