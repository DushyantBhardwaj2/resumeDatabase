import { prisma } from "../src/config/prisma"
import { logger } from "../src/infrastructure/logger"
import crypto from "crypto"

async function migrateProfileToDomains() {
  logger.info("Starting Profile → Domain migration...")

  const profiles = await prisma.profile.findMany()
  logger.info({ count: profiles.length }, "Profiles found")

  for (const profile of profiles) {
    const { id: profileId, userId, experience, projects, education, skills, certificates, achievements, extracurriculars, leadership } = profile

    // ── Migrate Experience entries ──
    const expList = (experience as any[]) ?? []
    for (const exp of expList) {
      const existing = await prisma.experience.findFirst({
        where: { userId, company: exp.company ?? "", role: exp.role ?? "" },
      })
      if (existing) continue

      const expRecord = await prisma.experience.create({
        data: {
          userId,
          company: exp.company ?? "",
          role: exp.role ?? "",
          startDate: exp.startDate ?? "",
          endDate: exp.endDate ?? undefined,
          current: exp.current ?? false,
          tags: exp.keywords ?? [],
          source: { type: "PDF_PARSE", importedAt: new Date().toISOString() },
        },
      })

      const bullets = exp.vaultBullets ?? exp.bullets ?? []
      for (let i = 0; i < (Array.isArray(bullets) ? bullets.length : 0); i++) {
        const b = bullets[i]
        await prisma.bullet.create({
          data: {
            id: b.id ?? crypto.randomUUID(),
            text: typeof b === "string" ? b : (b.text ?? ""),
            order: i,
            isAIGenerated: b.isAIGenerated ?? false,
            parentType: "experience",
            parentId: expRecord.id,
          },
        })
      }
    }

    // ── Migrate Project entries ──
    const projList = (projects as any[]) ?? []
    for (const proj of projList) {
      const existing = await prisma.project.findFirst({
        where: { userId, title: proj.title ?? "" },
      })
      if (existing) continue

      const projRecord = await prisma.project.create({
        data: {
          userId,
          title: proj.title ?? "",
          url: proj.url ?? undefined,
          techStack: proj.techStack ?? [],
          languages: [],
          topics: [],
          dependencies: [],
          tags: proj.keywords ?? [],
          source: { type: "PDF_PARSE", importedAt: new Date().toISOString() },
        },
      })

      const bullets = proj.vaultBullets ?? proj.bullets ?? []
      for (let i = 0; i < (Array.isArray(bullets) ? bullets.length : 0); i++) {
        const b = bullets[i]
        await prisma.bullet.create({
          data: {
            id: b.id ?? crypto.randomUUID(),
            text: typeof b === "string" ? b : (b.text ?? ""),
            order: i,
            isAIGenerated: b.isAIGenerated ?? false,
            parentType: "project",
            parentId: projRecord.id,
          },
        })
      }
    }

    // ── Migrate Education entries ──
    const eduList = (education as any[]) ?? []
    for (const edu of eduList) {
      const existing = await prisma.education.findFirst({
        where: { userId, school: edu.school ?? "" },
      })
      if (existing) continue

      await prisma.education.create({
        data: {
          userId,
          school: edu.school ?? "",
          degree: edu.degree ?? "",
          gpa: edu.gpa ?? undefined,
          startYear: edu.startYear ?? 0,
          endYear: edu.endYear ?? undefined,
          courses: edu.courses ?? [],
          tags: [],
        },
      })
    }

    // ── Migrate Skill entries ──
    const skillsData = skills as any ?? {}
    const allSkills = [
      ...(skillsData.languages ?? []).map((s: string) => ({ name: s, category: "LANGUAGE" })),
      ...(skillsData.frameworks ?? []).map((s: string) => ({ name: s, category: "FRAMEWORK" })),
      ...(skillsData.tools ?? []).map((s: string) => ({ name: s, category: "TOOL" })),
    ]
    for (const skill of allSkills) {
      try {
        await prisma.skill.upsert({
          where: { userId_name: { userId, name: skill.name } },
          create: { userId, name: skill.name, category: skill.category, tags: [] },
          update: {},
        })
      } catch {
        // Likely duplicate — skip
      }
    }

    // ── Migrate Certificate entries ──
    const certList = (certificates as any[]) ?? []
    for (const cert of certList) {
      const existing = await prisma.certificate.findFirst({
        where: { userId, name: cert.name ?? "" },
      })
      if (existing) continue

      await prisma.certificate.create({
        data: {
          userId,
          name: cert.name ?? "",
          issuer: cert.issuer ?? "",
          url: cert.url ?? undefined,
          date: cert.date ?? undefined,
          tags: [],
        },
      })
    }

    // ── Migrate Achievement entries (from achievements, extracurriculars, leadership) ──
    const achList = [...(achievements as any[] ?? []), ...(extracurriculars as any[] ?? [])]
    for (const ach of achList) {
      await prisma.achievement.create({
        data: {
          userId,
          title: ach.title ?? "",
          description: ach.description ?? "",
          date: ach.date ?? undefined,
          url: ach.url ?? undefined,
          type: ach.type ?? "VOLUNTEER",
          tags: [],
        },
      })
    }

    // Leadership entries
    const leadList = (leadership as any[]) ?? []
    for (const lead of leadList) {
      await prisma.achievement.create({
        data: {
          userId,
          title: lead.title ?? "",
          description: lead.description ?? "",
          date: lead.date ?? undefined,
          type: "LEADERSHIP",
          tags: [],
        },
      })
    }

    logger.info({ profileId, userId }, "Migration complete for profile")
  }

  // ── Migrate TailoredResume → ResumeDraft ──
  const tailoredResumes = await prisma.tailoredResume.findMany()
  logger.info({ count: tailoredResumes.length }, "TailoredResumes found")

  for (const tr of tailoredResumes) {
    const existing = await prisma.resumeDraft.findFirst({
      where: { userId: tr.userId, title: `${tr.companyName} — ${tr.jobTitle}` },
    })
    if (existing) continue

    await prisma.resumeDraft.create({
      data: {
        userId: tr.userId,
        title: `${tr.companyName} — ${tr.jobTitle}`,
        jobDescription: tr.jobDescription,
        templateId: "ats-clean",
        resumeSpec: {
          sections: {
            experience: { min: 1, max: 3, maxBullets: 5 },
            projects: { max: 3, maxBullets: 4 },
            education: { max: 1, required: true },
            skills: { priority: [], maxPerGroup: 10, max: 30 },
            certificates: { max: 3 },
          },
          sectionOrder: ["education", "experience", "projects", "skills", "certificates"],
          pageLimit: 1,
        },
        selections: [],
        kbVersion: "v1",
        compileStatus: "draft",
      },
    })
  }

  logger.info("Profile → Domain migration complete")
}

migrateProfileToDomains()
  .catch((err) => {
    logger.error({ err }, "Migration failed")
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
