import { prisma } from "../../config/prisma"
import type { DomainExperience } from "../../core/domain/entities"
import type { IExperienceRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

async function getBullets(parentId: string) {
  const rows = await prisma.bullet.findMany({
    where: { parentType: "experience", parentId },
    orderBy: { order: "asc" },
  })
  return rows.map((b) => ({
    id: b.id,
    text: b.text,
    order: b.order,
    isAIGenerated: b.isAIGenerated ?? undefined,
    parentType: b.parentType as "experience" | "project",
    parentId: b.parentId,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }))
}

function mapExperience(row: any, bullets: any[]): DomainExperience {
  return {
    id: row.id,
    userId: row.userId,
    company: row.company,
    role: row.role,
    startDate: row.startDate,
    endDate: row.endDate ?? undefined,
    current: row.current ?? undefined,
    location: row.location ?? undefined,
    bullets,
    tags: row.tags ?? [],
    source: row.source as any,
    pinned: row.pinned ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class ExperienceRepository implements IExperienceRepository {
  async findByUserId(userId: string): Promise<DomainExperience[]> {
    const rows = await prisma.experience.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    })
    const result: DomainExperience[] = []
    for (const row of rows) {
      const bullets = await getBullets(row.id)
      result.push(mapExperience(row, bullets))
    }
    return result
  }

  async findById(id: string): Promise<DomainExperience | null> {
    const row = await prisma.experience.findUnique({ where: { id } })
    if (!row) return null
    const bullets = await getBullets(row.id)
    return mapExperience(row, bullets)
  }

  async create(data: Omit<DomainExperience, "id" | "createdAt" | "updatedAt">): Promise<DomainExperience> {
    const { bullets, ...fields } = data
    const row = await prisma.experience.create({
      data: {
        ...fields,
        source: toJson(fields.source),
      },
    })
    if (bullets && bullets.length > 0) {
      await prisma.bullet.createMany({
        data: bullets.map((b, i) => ({
          id: b.id,
          text: b.text,
          order: b.order ?? i,
          isAIGenerated: b.isAIGenerated ?? false,
          parentType: "experience",
          parentId: row.id,
        })),
      })
    }
    const createdBullets = await getBullets(row.id)
    return mapExperience(row, createdBullets)
  }

  async update(id: string, data: Partial<DomainExperience>): Promise<DomainExperience> {
    const { bullets, ...fields } = data
    const updateData: any = { ...fields }
    if (fields.source) updateData.source = toJson(fields.source)

    const row = await prisma.experience.update({ where: { id }, data: updateData })
    const existingBullets = await getBullets(id)
    return mapExperience(row, existingBullets)
  }

  async delete(id: string): Promise<void> {
    await prisma.bullet.deleteMany({ where: { parentType: "experience", parentId: id } })
    await prisma.experience.delete({ where: { id } })
  }
}
