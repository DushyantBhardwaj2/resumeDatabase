import { prisma } from "../../config/prisma"
import type { DomainCertificate } from "../../core/domain/entities"
import type { ICertificateRepository } from "../../core/domain/repositories"

function mapCertificate(row: any): DomainCertificate {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    issuer: row.issuer,
    url: row.url ?? undefined,
    date: row.date ?? undefined,
    tags: row.tags ?? [],
    pinned: row.pinned ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class CertificateRepository implements ICertificateRepository {
  async findByUserId(userId: string): Promise<DomainCertificate[]> {
    const rows = await prisma.certificate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(mapCertificate)
  }

  async findById(id: string): Promise<DomainCertificate | null> {
    const row = await prisma.certificate.findUnique({ where: { id } })
    return row ? mapCertificate(row) : null
  }

  async create(data: Omit<DomainCertificate, "id">): Promise<DomainCertificate> {
    const row = await prisma.certificate.create({ data })
    return mapCertificate(row)
  }

  async update(id: string, data: Partial<DomainCertificate>): Promise<DomainCertificate> {
    const row = await prisma.certificate.update({ where: { id }, data })
    return mapCertificate(row)
  }

  async delete(id: string): Promise<void> {
    await prisma.certificate.delete({ where: { id } })
  }
}
