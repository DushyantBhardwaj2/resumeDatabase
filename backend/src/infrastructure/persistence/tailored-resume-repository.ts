import { prisma } from "../../config/prisma"
import type { ITailoredResumeRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export class TailoredResumeRepository implements ITailoredResumeRepository {
  async create(data: {
    userId: string
    companyName: string
    jobTitle: string
    jobDescription: string
    tailoredData: unknown
  }): Promise<void> {
    const createData: Record<string, unknown> = {
      userId: data.userId,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription,
      tailoredData: toJson(data.tailoredData),
    }
    await prisma.tailoredResume.create({ data: createData } as any)
  }

  async findByUserId(userId: string, search?: string) {
    const rows = await prisma.tailoredResume.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { companyName: { contains: search, mode: "insensitive" } },
                { jobTitle: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, companyName: true, jobTitle: true, createdAt: true },
    })
    return rows
  }

  async findById(id: string, userId: string) {
    const row = await prisma.tailoredResume.findFirst({ where: { id, userId } })
    return row
  }

  async deleteById(id: string, userId: string): Promise<void> {
    await prisma.tailoredResume.deleteMany({ where: { id, userId } })
  }

  async updateStyling(id: string, userId: string, styleConfig: Record<string, unknown>): Promise<void> {
    const existing = await prisma.tailoredResume.findFirst({ where: { id, userId } })
    if (!existing) throw new Error("Not found")
    const merged = { ...((existing.styleConfig as Record<string, unknown>) || {}), ...styleConfig }
    await prisma.tailoredResume.update({
      where: { id },
      data: { styleConfig: toJson(merged) },
    })
  }
}
