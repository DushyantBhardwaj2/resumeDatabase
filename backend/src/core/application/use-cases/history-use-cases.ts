import type { ITailoredResumeRepository } from "../../domain/repositories"

export class HistoryUseCases {
  constructor(private repo: ITailoredResumeRepository) {}

  async list(userId: string, search?: string) {
    return this.repo.findByUserId(userId, search)
  }

  async get(id: string, userId: string) {
    return this.repo.findById(id, userId)
  }

  async delete(id: string, userId: string) {
    return this.repo.deleteById(id, userId)
  }

  async updateStyling(id: string, userId: string, styleConfig: Record<string, unknown>) {
    return this.repo.updateStyling(id, userId, styleConfig)
  }
}
