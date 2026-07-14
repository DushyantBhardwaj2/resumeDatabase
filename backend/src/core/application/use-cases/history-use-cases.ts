import type { IResumeDraftRepository } from "../../domain/repositories"
import type { ResumeDraft } from "../../../shared"

export class HistoryUseCases {
  constructor(private draftRepo: IResumeDraftRepository) {}

  async list(userId: string, search?: string): Promise<ResumeDraft[]> {
    const drafts = await this.draftRepo.findByUserId(userId)
    if (!search) return drafts

    const q = search.toLowerCase()
    return drafts.filter(
      (d) => d.title.toLowerCase().includes(q) || d.jobDescription?.toLowerCase().includes(q)
    )
  }

  async get(id: string): Promise<ResumeDraft | null> {
    return this.draftRepo.findById(id)
  }

  async delete(id: string): Promise<void> {
    return this.draftRepo.delete(id)
  }
}
