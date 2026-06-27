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

  async saveFromOnboarding(userId: string, rawText: string, parsed: Profile, userInfo?: { name?: string | null; email?: string | null }): Promise<Profile> {
    if (userInfo) {
      if (!parsed.contact) parsed.contact = { name: null, email: null, phone: null, linkedin: null, github: null, leetcode: null, portfolio: null }
      if (!parsed.contact.name) parsed.contact.name = userInfo.name || null
      if (!parsed.contact.email) parsed.contact.email = userInfo.email || null
    }
    return this.repo.saveRaw(userId, rawText, parsed)
  }
}
