import { prisma } from "../../config/prisma"
import type { DomainBullet } from "../../core/domain/entities"
import type { IBulletRepository } from "../../core/domain/repositories"

function mapBullet(row: any): DomainBullet {
  return {
    id: row.id,
    text: row.text,
    order: row.order,
    isAIGenerated: row.isAIGenerated ?? undefined,
    parentType: row.parentType as "experience" | "project",
    parentId: row.parentId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class BulletRepository implements IBulletRepository {
  async findByParent(parentType: string, parentId: string): Promise<DomainBullet[]> {
    const rows = await prisma.bullet.findMany({
      where: { parentType, parentId },
      orderBy: { order: "asc" },
    })
    return rows.map(mapBullet)
  }

  async create(data: Omit<DomainBullet, "id" | "createdAt" | "updatedAt">): Promise<DomainBullet> {
    const row = await prisma.bullet.create({ data })
    return mapBullet(row)
  }

  async update(id: string, data: Partial<DomainBullet>): Promise<DomainBullet> {
    const row = await prisma.bullet.update({ where: { id }, data })
    return mapBullet(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.bullet.delete({ where: { id } })
  }

  async deleteByParent(parentType: string, parentId: string): Promise<void> {
    await prisma.bullet.deleteMany({ where: { parentType, parentId } })
  }
}
