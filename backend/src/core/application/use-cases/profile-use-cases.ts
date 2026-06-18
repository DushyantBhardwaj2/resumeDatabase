import type { Profile } from "../../domain/entities"
import type { IProfileRepository } from "../../domain/repositories"

export class ProfileUseCases {
  constructor(private repo: IProfileRepository) {}

  async getProfile(userId: string): Promise<Profile | null> {
    return this.repo.findByUserId(userId)
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    return this.repo.upsert(userId, data)
  }

  async saveFromOnboarding(userId: string, rawText: string, parsed: Profile): Promise<Profile> {
    return this.repo.saveRaw(userId, rawText, parsed)
  }
}
