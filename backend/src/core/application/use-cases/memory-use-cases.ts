import type {
  IExperienceRepository,
  IProjectRepository,
  IEducationRepository,
  ISkillRepository,
  ICertificateRepository,
  IAchievementRepository,
  IBulletRepository,
  IMemoryRepository,
} from "../../domain/repositories"
import type { IRetrieverService } from "../ports/retriever"
import type { DomainMemoryAction, DomainBullet } from "../../domain/entities"
import type { MemoryType } from "../../../shared"

export class MemoryUseCases {
  constructor(
    private experienceRepo: IExperienceRepository,
    private projectRepo: IProjectRepository,
    private educationRepo: IEducationRepository,
    private skillRepo: ISkillRepository,
    private certificateRepo: ICertificateRepository,
    private achievementRepo: IAchievementRepository,
    private bulletRepo: IBulletRepository,
    private retriever: IRetrieverService,
    private memoryRepo: IMemoryRepository,
  ) {}

  async search(userId: string, query?: string) {
    return this.memoryRepo.search(userId, query)
  }

  async getEntry(type: MemoryType, id: string) {
    return this.memoryRepo.getEntry(type, id)
  }

  async updateEntry(type: MemoryType, id: string, changes: Record<string, unknown>) {
    switch (type) {
      case "experience":
        return this.experienceRepo.update(id, changes as any)
      case "project":
        return this.projectRepo.update(id, changes as any)
      case "education":
        return this.educationRepo.update(id, changes as any)
      case "skill":
        return this.skillRepo.update(id, changes as any)
      case "certificate":
        return this.certificateRepo.update(id, changes as any)
      case "achievement":
        return this.achievementRepo.update(id, changes as any)
    }
  }

  async deleteEntry(type: MemoryType, id: string) {
    await this.bulletRepo.deleteByParent(type, id)
    await this.memoryRepo.deleteEntry(type, id)
  }

  async applyActions(userId: string, actions: DomainMemoryAction[]) {
    const results: Array<{ type: string; id: string }> = []

    for (const action of actions) {
      switch (action.type) {
        case "CREATE_EXPERIENCE": {
          const created = await this.experienceRepo.create({ ...action.experience, userId })
          if (action.experience.bullets?.length) {
            for (const b of action.experience.bullets) {
              await this.bulletRepo.create({ ...b, parentType: "experience", parentId: created.id })
            }
          }
          results.push({ type: "experience", id: created.id })
          break
        }

        case "CREATE_PROJECT": {
          const created = await this.projectRepo.create({ ...action.project, userId })
          if (action.project.bullets?.length) {
            for (const b of action.project.bullets) {
              await this.bulletRepo.create({ ...b, parentType: "project", parentId: created.id })
            }
          }
          results.push({ type: "project", id: created.id })
          break
        }

        case "CREATE_EDUCATION": {
          const created = await this.educationRepo.create({ ...action.education, userId })
          results.push({ type: "education", id: created.id })
          break
        }

        case "CREATE_SKILL": {
          const created = await this.skillRepo.create({ ...action.skill, userId })
          results.push({ type: "skill", id: created.id })
          break
        }

        case "CREATE_CERTIFICATE": {
          const created = await this.certificateRepo.create({ ...action.certificate, userId })
          results.push({ type: "certificate", id: created.id })
          break
        }

        case "CREATE_ACHIEVEMENT": {
          const created = await this.achievementRepo.create({ ...action.achievement, userId })
          results.push({ type: "achievement", id: created.id })
          break
        }

        case "UPDATE_ENTRY":
          await this.updateEntry(action.entryType as MemoryType, action.id, action.changes)
          results.push({ type: action.entryType, id: action.id })
          break

        case "DELETE_ENTRY":
          await this.deleteEntry(action.entryType as MemoryType, action.id)
          break

        case "MERGE_INTO": {
          const targetType = action.targetType as "experience" | "project"
          const sourceBullets = await this.bulletRepo.findByParent(targetType, action.sourceId)
          for (const b of sourceBullets) {
            await this.bulletRepo.create({ ...b, parentType: targetType, parentId: action.targetId })
          }
          await this.bulletRepo.deleteByParent(targetType, action.sourceId)
          await this.memoryRepo.deleteEntry(targetType as MemoryType, action.sourceId)
          results.push({ type: action.targetType, id: action.targetId })
          break
        }
      }
    }

    return results
  }
}
