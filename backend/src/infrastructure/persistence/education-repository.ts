import { prisma } from "../../config/prisma"
import type { DomainEducation } from "../../core/domain/entities"
import type { IEducationRepository } from "../../core/domain/repositories"

function mapEducation(row: any): DomainEducation {
  return {
    id: row.id,
    userId: row.userId,
    school: row.school,
    degree: row.degree,
    field: row.field ?? undefined,
    gpa: row.gpa ?? undefined,
    courses: row.courses ?? [],
    startYear: row.startYear,
    endYear: row.endYear ?? undefined,
    tags: row.tags ?? [],
    pinned: row.pinned ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class EducationRepository implements IEducationRepository {
  async findByUserId(userId: string): Promise<DomainEducation[]> {
    const rows = await prisma.education.findMany({
      where: { userId },
      orderBy: { startYear: "desc" },
    })
    return rows.map(mapEducation)
  }

  async findById(id: string): Promise<DomainEducation | null> {
    const row = await prisma.education.findUnique({ where: { id } })
    return row ? mapEducation(row) : null
  }

  async create(data: Omit<DomainEducation, "id">): Promise<DomainEducation> {
    const row = await prisma.education.create({ data })
    return mapEducation(row)
  }

  async update(id: string, data: Partial<DomainEducation>): Promise<DomainEducation> {
    const row = await prisma.education.update({ where: { id }, data })
    return mapEducation(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.education.delete({ where: { id } })
  }
}
