import type { IAIService, ISchema } from "../ports/ai-service"
import type { IRetrieverService } from "../ports/retriever"
import type { IResumeSpecEngine } from "../ports/resume-spec"
import type { IResumeFitService } from "../ports/resume-fit"
import type { IKnowledgeBaseService } from "../ports/knowledge-base"
import type { IResumeDraftRepository } from "../../domain/repositories"
import type { JDAnalysis, ResumeSelection, ResumeDraft, ResumeFitScore } from "../../../shared"
import { jdParserSchema, bulletSelectSchema } from "./schemas"

function makeSchema<T>(schema: z.ZodType<T>): ISchema<T> {
  return { parse: (data: unknown) => schema.parse(data) }
}

import { z } from "zod"

export class ResumeEngine {
  constructor(
    private aiService: IAIService,
    private retriever: IRetrieverService,
    private specEngine: IResumeSpecEngine,
    private resumeFit: IResumeFitService,
    private kb: IKnowledgeBaseService,
    private draftRepo: IResumeDraftRepository,
  ) {}

  async createDraft(userId: string, jobDescription: string, templateId = "ats-clean"): Promise<{
    draft: ResumeDraft
    jdAnalysis: JDAnalysis
    selections: ResumeSelection[]
    resumeFit?: ResumeFitScore
  }> {
    const jdAnalysis = await this._parseJD(jobDescription)

    const entries = await this.retriever.search({
      userId,
      query: [jdAnalysis.role, ...jdAnalysis.requiredSkills, ...jdAnalysis.keywords].join(" "),
      maxResults: 30,
      contextHint: jdAnalysis.experienceLevel,
    })

    const selections = await this._selectBullets(jdAnalysis, entries)

    const spec = this.specEngine.getDefaultSpec(templateId)

    const filtered = this.specEngine.apply(spec, selections)

    const draft = await this.draftRepo.create({
      userId,
      title: jdAnalysis.company ? `${jdAnalysis.company} — ${jdAnalysis.role}` : jdAnalysis.role,
      jobDescription,
      jdAnalysis,
      templateId,
      resumeSpec: spec,
      selections: [...filtered.experience, ...filtered.projects, ...filtered.education],
      kbVersion: this.kb.getCurrentVersion(),
      compileStatus: "draft",
    })

    const resumeFit = await this.resumeFit.compute(draft.id)

    return { draft, jdAnalysis, selections: draft.selections, resumeFit }
  }

  async refreshDraft(draftId: string): Promise<{
    draft: ResumeDraft
    jdAnalysis: JDAnalysis
    selections: ResumeSelection[]
  }> {
    const existing = await this.draftRepo.findById(draftId)
    if (!existing) throw new Error("Draft not found")
    if (!existing.jdAnalysis) throw new Error("Draft has no JD analysis")

    const entries = await this.retriever.search({
      userId: existing.userId,
      query: [existing.jdAnalysis.role, ...existing.jdAnalysis.requiredSkills, ...existing.jdAnalysis.keywords].join(" "),
      maxResults: 30,
      contextHint: existing.jdAnalysis.experienceLevel,
    })

    const selections = await this._selectBullets(existing.jdAnalysis, entries)

    const filtered = this.specEngine.apply(existing.resumeSpec, selections)

    const draft = await this.draftRepo.update(draftId, {
      selections: [...filtered.experience, ...filtered.projects, ...filtered.education],
    })

    return { draft, jdAnalysis: existing.jdAnalysis, selections: draft.selections }
  }

  private async _parseJD(jobDescription: string): Promise<JDAnalysis> {
    const kbCtx = this.kb.getContext("CREATE_RESUME" as any)
    const systemPrompt = kbCtx?.files?.map((f: any) => f.content).join("\n") ?? "Extract structured information from the following job description."

    try {
      const result = await this.aiService.generateStructuredData(
        `${systemPrompt}\n\nExtract structured data from this job description.`,
        jobDescription,
        makeSchema(jdParserSchema)
      )
      return result
    } catch {
      return {
        role: "Professional",
        requiredSkills: [],
        preferredSkills: [],
        experienceLevel: "mid",
        responsibilities: [],
        keywords: [],
      }
    }
  }

  private async _selectBullets(
    jdAnalysis: JDAnalysis,
    entries: any[],
  ): Promise<ResumeSelection[]> {
    const systemPrompt = `Select the best entries and bullets for a resume targeting this role.`
    const userContent = JSON.stringify({ jdAnalysis, availableEntries: entries })

    try {
      const result = await this.aiService.generateStructuredData(
        systemPrompt,
        userContent,
        makeSchema(bulletSelectSchema)
      )
      return result.selections.map((s: any, i: number) => ({
        entryType: s.entryType,
        entryId: s.entryId,
        confidence: s.confidence,
        rank: i + 1,
        rationale: s.rationale,
        selectedBulletIds: s.selectedBulletIds,
      }))
    } catch {
      return entries.slice(0, 5).map((e, i) => ({
        entryType: e.type === "experience" ? "experience" : e.type === "project" ? "project" : "education",
        entryId: e.id,
        confidence: 0.7,
        rank: i + 1,
        rationale: "Auto-selected",
        selectedBulletIds: [],
      }))
    }
  }
}
