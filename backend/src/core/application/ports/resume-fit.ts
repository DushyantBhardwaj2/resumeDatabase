import type { ResumeFitScore as RFScore } from "../../../shared"

export type { RFScore as ResumeFitScore }

export interface IResumeFitService {
  compute(draftId: string): Promise<RFScore>
}
