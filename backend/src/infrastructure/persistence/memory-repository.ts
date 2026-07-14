import { prisma } from "../../config/prisma"
import type { DomainExperience, DomainProject, DomainEducation, DomainSkill, DomainCertificate, DomainAchievement, MemoryType } from "../../core/domain/entities"
import type { IMemoryRepository } from "../../core/domain/repositories"
import type { EntrySummary } from "../../shared"

export class MemoryRepository implements IMemoryRepository {
  async getEntry(type: MemoryType, id: string): Promise<DomainExperience | DomainProject | DomainEducation | DomainSkill | DomainCertificate | DomainAchievement | null> {
    switch (type) {
      case "experience": {
        const row = await prisma.experience.findUnique({ where: { id } })
        if (!row) return null
        const bullets = await prisma.bullet.findMany({
          where: { parentType: "experience", parentId: id },
          orderBy: { order: "asc" },
        })
        return {
          id: row.id,
          userId: row.userId,
          company: row.company,
          role: row.role,
          startDate: row.startDate,
          endDate: row.endDate ?? undefined,
          current: row.current ?? undefined,
          location: row.location ?? undefined,
          bullets: bullets.map((b) => ({
            id: b.id,
            text: b.text,
            order: b.order,
            isAIGenerated: b.isAIGenerated ?? undefined,
            parentType: "experience" as const,
            parentId: b.parentId,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
          })),
          tags: row.tags,
          source: row.source as any,
          pinned: row.pinned ?? undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }
      }
      case "project": {
        const row = await prisma.project.findUnique({ where: { id } })
        if (!row) return null
        const bullets = await prisma.bullet.findMany({
          where: { parentType: "project", parentId: id },
          orderBy: { order: "asc" },
        })
        return {
          id: row.id,
          userId: row.userId,
          title: row.title,
          url: row.url ?? undefined,
          githubUrl: row.githubUrl ?? undefined,
          readme: row.readme ?? undefined,
          languages: row.languages,
          topics: row.topics,
          commitCount: row.commitCount ?? undefined,
          dependencies: row.dependencies,
          techStack: row.techStack,
          bullets: bullets.map((b) => ({
            id: b.id,
            text: b.text,
            order: b.order,
            isAIGenerated: b.isAIGenerated ?? undefined,
            parentType: "project" as const,
            parentId: b.parentId,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
          })),
          tags: row.tags,
          source: row.source as any,
          pinned: row.pinned ?? undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }
      }
      case "education": {
        const row = await prisma.education.findUnique({ where: { id } })
        if (!row) return null
        return {
          id: row.id,
          userId: row.userId,
          school: row.school,
          degree: row.degree,
          field: row.field ?? undefined,
          gpa: row.gpa ?? undefined,
          courses: row.courses,
          startYear: row.startYear,
          endYear: row.endYear ?? undefined,
          tags: row.tags,
          pinned: row.pinned ?? undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }
      }
      case "skill": {
        const row = await prisma.skill.findUnique({ where: { id } })
        if (!row) return null
        return {
          id: row.id,
          userId: row.userId,
          name: row.name,
          category: row.category as any,
          proficiency: (row.proficiency ?? undefined) as any,
          tags: row.tags,
          pinned: row.pinned ?? undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }
      }
      case "certificate": {
        const row = await prisma.certificate.findUnique({ where: { id } })
        if (!row) return null
        return {
          id: row.id,
          userId: row.userId,
          name: row.name,
          issuer: row.issuer,
          url: row.url ?? undefined,
          date: row.date ?? undefined,
          tags: row.tags,
          pinned: row.pinned ?? undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }
      }
      case "achievement": {
        const row = await prisma.achievement.findUnique({ where: { id } })
        if (!row) return null
        return {
          id: row.id,
          userId: row.userId,
          title: row.title,
          description: row.description,
          date: row.date ?? undefined,
          url: row.url ?? undefined,
          type: row.type as any,
          tags: row.tags,
          pinned: row.pinned ?? undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }
      }
      default:
        return null
    }
  }

  async deleteEntry(type: MemoryType, id: string): Promise<void> {
    switch (type) {
      case "experience":
        await prisma.bullet.deleteMany({ where: { parentType: "experience", parentId: id } })
        await prisma.experience.delete({ where: { id } })
        break
      case "project":
        await prisma.bullet.deleteMany({ where: { parentType: "project", parentId: id } })
        await prisma.project.delete({ where: { id } })
        break
      case "education":
        await prisma.education.delete({ where: { id } })
        break
      case "skill":
        await prisma.skill.delete({ where: { id } })
        break
      case "certificate":
        await prisma.certificate.delete({ where: { id } })
        break
      case "achievement":
        await prisma.achievement.delete({ where: { id } })
        break
    }
  }

  async search(userId: string, query?: string): Promise<EntrySummary[]> {
    const experiences = await prisma.experience.findMany({ where: { userId } })
    const projects = await prisma.project.findMany({ where: { userId } })
    const educations = await prisma.education.findMany({ where: { userId } })
    const skills = await prisma.skill.findMany({ where: { userId } })
    const certificates = await prisma.certificate.findMany({ where: { userId } })
    const achievements = await prisma.achievement.findMany({ where: { userId } })

    const summaries: EntrySummary[] = []
    const now = new Date()

    const getRecencyDays = (updatedAt: Date) => {
      const diffTime = Math.abs(now.getTime() - updatedAt.getTime())
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    for (const exp of experiences) {
      const bullets = await prisma.bullet.findMany({
        where: { parentType: "experience", parentId: exp.id },
        orderBy: { order: "asc" },
      })
      const bulletSummary = bullets[0]?.text ?? ""
      summaries.push({
        id: exp.id,
        type: "experience",
        title: `${exp.role} at ${exp.company}`,
        keywords: exp.tags,
        bulletSummary,
        score: 1.0,
        recencyDays: getRecencyDays(exp.updatedAt),
      })
    }

    for (const proj of projects) {
      const bullets = await prisma.bullet.findMany({
        where: { parentType: "project", parentId: proj.id },
        orderBy: { order: "asc" },
      })
      const bulletSummary = bullets[0]?.text ?? ""
      summaries.push({
        id: proj.id,
        type: "project",
        title: proj.title,
        keywords: [...proj.tags, ...proj.techStack],
        bulletSummary,
        score: 1.0,
        recencyDays: getRecencyDays(proj.updatedAt),
      })
    }

    for (const edu of educations) {
      summaries.push({
        id: edu.id,
        type: "education",
        title: `${edu.degree} at ${edu.school}`,
        keywords: edu.tags,
        bulletSummary: `${edu.school} (${edu.startYear} - ${edu.endYear || "Present"})`,
        score: 1.0,
        recencyDays: getRecencyDays(edu.updatedAt),
      })
    }

    for (const sk of skills) {
      summaries.push({
        id: sk.id,
        type: "skill",
        title: sk.name,
        keywords: [sk.category, ...(sk.proficiency ? [sk.proficiency] : []), ...sk.tags],
        bulletSummary: `Category: ${sk.category}${sk.proficiency ? `, Proficiency: ${sk.proficiency}` : ""}`,
        score: 1.0,
        recencyDays: getRecencyDays(sk.updatedAt),
      })
    }

    for (const cert of certificates) {
      summaries.push({
        id: cert.id,
        type: "certificate",
        title: cert.name,
        keywords: [cert.issuer, ...cert.tags],
        bulletSummary: `Issued by ${cert.issuer}${cert.date ? ` on ${cert.date}` : ""}`,
        score: 1.0,
        recencyDays: getRecencyDays(cert.updatedAt),
      })
    }

    for (const ach of achievements) {
      summaries.push({
        id: ach.id,
        type: "achievement",
        title: ach.title,
        keywords: [ach.type, ...ach.tags],
        bulletSummary: ach.description,
        score: 1.0,
        recencyDays: getRecencyDays(ach.updatedAt),
      })
    }

    if (query && query.trim().length > 0) {
      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
      const scored = summaries.map(s => {
        let score = 0
        const textToSearch = `${s.title} ${s.keywords.join(" ")} ${s.bulletSummary}`.toLowerCase()
        for (const term of queryTerms) {
          if (textToSearch.includes(term)) {
            score += 1
          }
        }
        return { ...s, score }
      }).filter(s => s.score > 0)

      scored.sort((a, b) => b.score - a.score)
      return scored
    }

    // Default sorting when no query is present: most recent first
    summaries.sort((a, b) => a.recencyDays - b.recencyDays)
    return summaries
  }
}
