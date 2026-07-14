import { prisma } from "../../config/prisma"
import type { ResumeDraft, ResumeSelection, ResumeSpec, JDAnalysis } from "../../core/domain/entities"
import type { IResumeDraftRepository } from "../../core/domain/repositories"
import type { Prisma } from "@prisma/client"

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function mapDraft(row: any): ResumeDraft {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    jobDescription: row.jobDescription,
    jdAnalysis: row.jdAnalysis ? (row.jdAnalysis as unknown as JDAnalysis) : undefined,
    templateId: row.templateId,
    resumeSpec: row.resumeSpec as unknown as ResumeSpec,
    selections: row.selections as unknown as ResumeSelection[],
    kbVersion: row.kbVersion,
    compileStatus: row.compileStatus as ResumeDraft["compileStatus"],
    pdfCacheKey: row.pdfCacheKey ?? undefined,
    lastCompiledAt: row.lastCompiledAt?.toISOString() ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class DraftRepository implements IResumeDraftRepository {
  async findByUserId(userId: string): Promise<ResumeDraft[]> {
    const rows = await prisma.resumeDraft.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    })
    return rows.map(mapDraft)
  }

  async findById(id: string): Promise<ResumeDraft | null> {
    const row = await prisma.resumeDraft.findUnique({ where: { id } })
    return row ? mapDraft(row) : null
  }

  async create(data: Omit<ResumeDraft, "id" | "createdAt" | "updatedAt">): Promise<ResumeDraft> {
    const row = await prisma.resumeDraft.create({
      data: {
        ...data,
        jdAnalysis: data.jdAnalysis ? toJson(data.jdAnalysis) : undefined,
        resumeSpec: toJson(data.resumeSpec),
        selections: toJson(data.selections),
      },
    })
    return mapDraft(row)
  }

  async update(id: string, data: Partial<ResumeDraft>): Promise<ResumeDraft> {
    const updateData: any = { ...data }
    if (data.jdAnalysis) updateData.jdAnalysis = toJson(data.jdAnalysis)
    if (data.resumeSpec) updateData.resumeSpec = toJson(data.resumeSpec)
    if (data.selections) updateData.selections = toJson(data.selections)
    if (data.compileStatus !== undefined) updateData.compileStatus = data.compileStatus
    if (data.pdfCacheKey !== undefined) updateData.pdfCacheKey = data.pdfCacheKey
    if (data.lastCompiledAt !== undefined) updateData.lastCompiledAt = data.lastCompiledAt ? new Date(data.lastCompiledAt) : null

    const row = await prisma.resumeDraft.update({ where: { id }, data: updateData })
    return mapDraft(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.resumeDraft.delete({ where: { id } })
  }
}
