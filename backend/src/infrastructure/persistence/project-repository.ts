import { prisma } from "../../config/prisma"
import type { DomainProject } from "../../core/domain/entities"
import type { IProjectRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

async function getBullets(parentId: string) {
  const rows = await prisma.bullet.findMany({
    where: { parentType: "project", parentId },
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

function mapProject(row: any, bullets: any[]): DomainProject {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    url: row.url ?? undefined,
    githubUrl: row.githubUrl ?? undefined,
    readme: row.readme ?? undefined,
    languages: row.languages ?? [],
    topics: row.topics ?? [],
    commitCount: row.commitCount ?? undefined,
    dependencies: row.dependencies ?? [],
    techStack: row.techStack ?? [],
    bullets,
    tags: row.tags ?? [],
    source: row.source as any,
    pinned: row.pinned ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class ProjectRepository implements IProjectRepository {
  async findByUserId(userId: string): Promise<DomainProject[]> {
    const rows = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    const result: DomainProject[] = []
    for (const row of rows) {
      const bullets = await getBullets(row.id)
      result.push(mapProject(row, bullets))
    }
    return result
  }

  async findById(id: string): Promise<DomainProject | null> {
    const row = await prisma.project.findUnique({ where: { id } })
    if (!row) return null
    const bullets = await getBullets(row.id)
    return mapProject(row, bullets)
  }

  async create(data: Omit<DomainProject, "id" | "createdAt" | "updatedAt">): Promise<DomainProject> {
    const { bullets, ...fields } = data
    const row = await prisma.project.create({
      data: { ...fields, source: toJson(fields.source) },
    })
    if (bullets && bullets.length > 0) {
      await prisma.bullet.createMany({
        data: bullets.map((b, i) => ({
          id: b.id,
          text: b.text,
          order: b.order ?? i,
          isAIGenerated: b.isAIGenerated ?? false,
          parentType: "project",
          parentId: row.id,
        })),
      })
    }
    const createdBullets = await getBullets(row.id)
    return mapProject(row, createdBullets)
  }

  async update(id: string, data: Partial<DomainProject>): Promise<DomainProject> {
    const { bullets, ...fields } = data
    const updateData: any = { ...fields }
    if (fields.source) updateData.source = toJson(fields.source)

    const row = await prisma.project.update({ where: { id }, data: updateData })
    const existingBullets = await getBullets(id)
    return mapProject(row, existingBullets)
  }

  async delete(id: string): Promise<void> {
    await prisma.bullet.deleteMany({ where: { parentType: "project", parentId: id } })
    await prisma.project.delete({ where: { id } })
  }
}
