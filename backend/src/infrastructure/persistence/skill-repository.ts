import { prisma } from "../../config/prisma"
import type { DomainSkill } from "../../core/domain/entities"
import type { ISkillRepository } from "../../core/domain/repositories"

function mapSkill(row: any): DomainSkill {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    category: row.category as DomainSkill["category"],
    proficiency: row.proficiency as DomainSkill["proficiency"] ?? undefined,
    tags: row.tags ?? [],
    pinned: row.pinned ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class SkillRepository implements ISkillRepository {
  async findByUserId(userId: string): Promise<DomainSkill[]> {
    const rows = await prisma.skill.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    })
    return rows.map(mapSkill)
  }

  async findById(id: string): Promise<DomainSkill | null> {
    const row = await prisma.skill.findUnique({ where: { id } })
    return row ? mapSkill(row) : null
  }

  async create(data: Omit<DomainSkill, "id">): Promise<DomainSkill> {
    const row = await prisma.skill.create({ data })
    return mapSkill(row)
  }

  async update(id: string, data: Partial<DomainSkill>): Promise<DomainSkill> {
    const row = await prisma.skill.update({ where: { id }, data })
    return mapSkill(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.skill.delete({ where: { id } })
  }

  async upsertByUserId(userId: string, name: string, data: Partial<DomainSkill>): Promise<DomainSkill> {
    const row = await prisma.skill.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name, category: data.category ?? "CONCEPT", tags: data.tags ?? [], ...data },
      update: { ...data },
    })
    return mapSkill(row)
  }
}
