import { prisma } from "../../config/prisma"
import type { DomainAchievement } from "../../core/domain/entities"
import type { IAchievementRepository } from "../../core/domain/repositories"

function mapAchievement(row: any): DomainAchievement {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    date: row.date ?? undefined,
    url: row.url ?? undefined,
    type: row.type as DomainAchievement["type"],
    tags: row.tags ?? [],
    pinned: row.pinned ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class AchievementRepository implements IAchievementRepository {
  async findByUserId(userId: string): Promise<DomainAchievement[]> {
    const rows = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(mapAchievement)
  }

  async findById(id: string): Promise<DomainAchievement | null> {
    const row = await prisma.achievement.findUnique({ where: { id } })
    return row ? mapAchievement(row) : null
  }

  async create(data: Omit<DomainAchievement, "id">): Promise<DomainAchievement> {
    const row = await prisma.achievement.create({ data })
    return mapAchievement(row)
  }

  async update(id: string, data: Partial<DomainAchievement>): Promise<DomainAchievement> {
    const row = await prisma.achievement.update({ where: { id }, data })
    return mapAchievement(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.achievement.delete({ where: { id } })
  }
}
