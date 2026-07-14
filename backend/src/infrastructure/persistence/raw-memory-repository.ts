import { prisma } from "../../config/prisma"
import type { DomainRawMemory } from "../../core/domain/entities"
import type { IRawMemoryRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function mapRawMemory(row: any): DomainRawMemory {
  return {
    id: row.id,
    userId: row.userId,
    source: row.source as DomainRawMemory["source"],
    content: row.content,
    metadata: row.metadata as any,
    createdAt: row.createdAt.toISOString(),
  }
}

export class RawMemoryRepository implements IRawMemoryRepository {
  async findByUserId(userId: string): Promise<DomainRawMemory[]> {
    const rows = await prisma.rawMemory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(mapRawMemory)
  }

  async findById(id: string): Promise<DomainRawMemory | null> {
    const row = await prisma.rawMemory.findUnique({ where: { id } })
    return row ? mapRawMemory(row) : null
  }

  async create(data: Omit<DomainRawMemory, "id">): Promise<DomainRawMemory> {
    const row = await prisma.rawMemory.create({
      data: { ...data, metadata: toJson(data.metadata) },
    })
    return mapRawMemory(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.rawMemory.delete({ where: { id } })
  }
}
