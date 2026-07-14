import type { ResumeDraft, JDAnalysis, ResumeSelection, ResumeFitScore } from "../../../shared"

export interface ResumeEngineResult {
  draft: ResumeDraft
  jdAnalysis: JDAnalysis
  selections: ResumeSelection[]
  resumeFit?: ResumeFitScore
}

export interface IResumeEngine {
  createDraft(params: { userId: string; jobDescription: string }): Promise<ResumeEngineResult>
  refreshDraft(draftId: string): Promise<ResumeEngineResult>
}
