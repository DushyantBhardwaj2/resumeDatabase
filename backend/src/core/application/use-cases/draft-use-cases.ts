import type { IResumeDraftRepository, IExperienceRepository, IProjectRepository, IEducationRepository } from "../../domain/repositories"
import type { IResumeSpecEngine } from "../ports/resume-spec"
import type { IRetrieverService } from "../ports/retriever"
import type { IAIService } from "../ports/ai-service"
import type { ResumeDraft, ResumeSelection, ResumeSpec, JDAnalysis } from "../../../shared"

export class DraftUseCases {
  constructor(
    private draftRepo: IResumeDraftRepository,
    private experienceRepo: IExperienceRepository,
    private projectRepo: IProjectRepository,
    private educationRepo: IEducationRepository,
    private specEngine: IResumeSpecEngine,
    private retriever: IRetrieverService,
    private aiService: IAIService,
    private kbVersion: string,
  ) {}

  async list(userId: string): Promise<ResumeDraft[]> {
    return this.draftRepo.findByUserId(userId)
  }

  async get(id: string): Promise<ResumeDraft | null> {
    return this.draftRepo.findById(id)
  }

  async create(userId: string, input: {
    jobDescription: string
    jdAnalysis: JDAnalysis
    selections: ResumeSelection[]
    templateId: string
  }): Promise<ResumeDraft> {
    const spec = this.specEngine.getDefaultSpec(input.templateId)

    const title = input.jdAnalysis.company
      ? `${input.jdAnalysis.company} — ${input.jdAnalysis.role}`
      : input.jdAnalysis.role

    return this.draftRepo.create({
      userId,
      title,
      jobDescription: input.jobDescription,
      jdAnalysis: input.jdAnalysis,
      templateId: input.templateId,
      resumeSpec: spec,
      selections: input.selections,
      kbVersion: this.kbVersion,
      compileStatus: "draft",
    })
  }

  async update(id: string, data: {
    selections?: ResumeSelection[]
    templateId?: string
    resumeSpec?: ResumeSpec
  }): Promise<ResumeDraft> {
    const draft = await this.draftRepo.findById(id)
    if (!draft) throw new Error("Draft not found")

    let spec = draft.resumeSpec
    if (data.templateId && data.templateId !== draft.templateId) {
      spec = this.specEngine.getDefaultSpec(data.templateId)
    }

    return this.draftRepo.update(id, {
      ...(data.selections ? { selections: data.selections } : {}),
      ...(data.templateId ? { templateId: data.templateId, resumeSpec: spec } : {}),
      ...(data.resumeSpec ? { resumeSpec: data.resumeSpec } : {}),
    })
  }

  async delete(id: string): Promise<void> {
    return this.draftRepo.delete(id)
  }

  async duplicate(id: string, userId: string): Promise<ResumeDraft> {
    const original = await this.draftRepo.findById(id)
    if (!original) throw new Error("Draft not found")

    return this.draftRepo.create({
      userId,
      title: `${original.title} (copy)`,
      jobDescription: original.jobDescription,
      jdAnalysis: original.jdAnalysis,
      templateId: original.templateId,
      resumeSpec: original.resumeSpec,
      selections: [...original.selections],
      kbVersion: this.kbVersion,
      compileStatus: "draft",
    })
  }

  async refreshSelections(id: string): Promise<ResumeDraft> {
    const draft = await this.draftRepo.findById(id)
    if (!draft) throw new Error("Draft not found")
    if (!draft.jdAnalysis) throw new Error("Draft has no JD analysis")

    const query = [
      draft.jdAnalysis.role,
      ...draft.jdAnalysis.requiredSkills,
      ...draft.jdAnalysis.preferredSkills,
    ].join(" ")

    const entries = await this.retriever.search({
      userId: draft.userId,
      query,
      maxResults: 30,
      contextHint: draft.jdAnalysis.experienceLevel,
    })

    const selectionPrompt = `Select the best entries and bullets for this resume.\nJD Analysis: ${JSON.stringify(draft.jdAnalysis)}\nAvailable entries: ${JSON.stringify(entries)}`

    return this.draftRepo.update(id, {})
  }
}
