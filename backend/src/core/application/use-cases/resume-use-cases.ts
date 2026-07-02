import type { Profile, TailoredOutput, Experience, Project, VaultBullet } from "../../domain/entities"
import type { IProfileRepository, ITailoredResumeRepository } from "../../domain/repositories"
import type { IAIService, ISchema } from "../ports/ai-service"
import type { IPDFParser } from "../ports/pdf-parser"
import type { ILatexTemplateFiller, TemplateConfig } from "../ports/latex-compiler"

type BulletSelection = {
  selections: Record<string, string[]>
  rationale: string
}

function applyTemplateConstraints(tailored: TailoredOutput, config: TemplateConfig): void {
  const expConfig = config.placeholders.experience
  const projConfig = config.placeholders.projects

  // Truncate entries to maxEntries
  if (tailored.experience.length > expConfig.maxEntries) {
    tailored.experience = tailored.experience.slice(0, expConfig.maxEntries)
  }
  if (tailored.projects.length > projConfig.maxEntries) {
    tailored.projects = tailored.projects.slice(0, projConfig.maxEntries)
  }

  // Truncate bullets per entry/project to maxBullets
  for (const exp of tailored.experience) {
    if (exp.vaultBullets.length > expConfig.maxBullets) {
      exp.vaultBullets = exp.vaultBullets.slice(0, expConfig.maxBullets)
    }
  }
  for (const proj of tailored.projects) {
    if (proj.vaultBullets.length > projConfig.maxBullets) {
      proj.vaultBullets = proj.vaultBullets.slice(0, projConfig.maxBullets)
    }
  }
}

function assignItemIds(profile: Profile): Profile {
  return {
    ...profile,
    experience: profile.experience.map((exp) => {
      const e = exp as unknown as Record<string, unknown>
      return e.id ? exp : { ...exp, id: crypto.randomUUID() }
    }),
    projects: profile.projects.map((proj) => {
      const p = proj as unknown as Record<string, unknown>
      return p.id ? proj : { ...proj, id: crypto.randomUUID() }
    }),
  } as Profile
}

function buildTailoredFromSelections(
  profile: Profile,
  selections: Record<string, string[]>
): TailoredOutput {
  const expMap = new Map<string, Experience>()
  for (const exp of profile.experience) {
    const id = (exp as unknown as Record<string, unknown>).id as string
    const selectedIds = selections[id]
    if (selectedIds && selectedIds.length > 0) {
      expMap.set(id, {
        ...exp,
        vaultBullets: exp.vaultBullets.filter((b) => selectedIds.includes(b.id)),
      })
    } else {
      expMap.set(id, { ...exp })
    }
  }

  const projMap = new Map<string, Project>()
  for (const proj of profile.projects) {
    const id = (proj as unknown as Record<string, unknown>).id as string
    const selectedIds = selections[id]
    if (selectedIds && selectedIds.length > 0) {
      projMap.set(id, {
        ...proj,
        vaultBullets: proj.vaultBullets.filter((b) => selectedIds.includes(b.id)),
      })
    } else {
      projMap.set(id, { ...proj })
    }
  }

  return {
    summary: null,
    experience: Array.from(expMap.values()),
    projects: Array.from(projMap.values()),
    skills: profile.skills,
  }
}

export class ResumeUseCases {
  constructor(
    private profileRepo: IProfileRepository,
    private tailorRepo: ITailoredResumeRepository,
    private aiService: IAIService,
    private pdfParser: IPDFParser,
    private latexTemplate: ILatexTemplateFiller,
    private parsePrompt: string,
    private parseSchema: ISchema<unknown>,
    private bulletSelectorPrompt: string,
    private bulletSelectorSchema: ISchema<unknown>
  ) {}

  async parseResume(buffer: Buffer): Promise<{ rawText: string; parsed: Profile }> {
    const rawText = await this.pdfParser.extractText(buffer)
    const parsed = await this.aiService.generateStructuredData(this.parsePrompt, rawText, this.parseSchema)
    return { rawText, parsed: parsed as unknown as Profile }
  }

  async tailorResume(
    userId: string,
    input: { jobTitle: string; company: string; jobDescription: string },
    templateId: string = 'nsut-canonical'
  ): Promise<{ jobTitle: string; company: string; original: Profile; tailored: TailoredOutput; latex: string }> {
    let profile = await this.profileRepo.findByUserId(userId)
    if (!profile) throw new Error("Profile not found. Complete onboarding first.")

    profile = assignItemIds(profile)

    // Bullet selection path: AI selects matching bullets from vault, built locally
    // Send only what the AI needs — strip heavy metadata to reduce latency
    const compactProfile = {
      experience: profile.experience.map((e) => ({
        id: (e as unknown as Record<string, unknown>).id as string,
        role: e.role,
        company: e.company,
        vaultBullets: e.vaultBullets.map((b) => ({ id: b.id, text: b.text, keywords: b.keywords })),
      })),
      projects: profile.projects.map((p) => ({
        id: (p as unknown as Record<string, unknown>).id as string,
        title: p.title,
        vaultBullets: p.vaultBullets.map((b) => ({ id: b.id, text: b.text, keywords: b.keywords })),
      })),
    }
    const userContent = JSON.stringify({
      jobDescription: input.jobDescription,
      profile: compactProfile,
    })
    // Start both AI generation tasks in parallel to avoid Vercel timeouts
    const selectionPromise = this.aiService.generateStructuredData(
      this.bulletSelectorPrompt,
      userContent,
      this.bulletSelectorSchema
    ) as Promise<unknown>

    const summaryPromise = this.aiService.generateStructuredData(
      "You are a resume summary writer. Given the job description and candidate profile, generate a 2-sentence professional summary. Output ONLY valid JSON: {\"summary\": string}",
      JSON.stringify({ jobDescription: input.jobDescription, profile: compactProfile }),
      { parse: (data: unknown) => data as { summary: string } }
    ).then((r) => (r as { summary?: string }).summary).catch((err) => {
      console.error("[tailorResume] Summary AI failed:", err)
      return null
    })

    // Await both promises
    const [selectionResultRaw, summary] = await Promise.all([selectionPromise, summaryPromise])
    const selectionResult = selectionResultRaw as BulletSelection

    const tailored = buildTailoredFromSelections(profile, selectionResult.selections)

    // Apply template config constraints (truncate entries/bullets)
    const templateConfig = this.latexTemplate.getTemplateConfig(templateId)
    applyTemplateConstraints(tailored, templateConfig)

    if (summary) tailored.summary = summary

    const latex = this.latexTemplate.fill(
      templateId,
      profile.contact as unknown as Record<string, unknown>,
      profile.education as unknown as Array<Record<string, unknown>>,
      profile.experience as unknown as Array<Record<string, unknown>>,
      profile.projects as unknown as Array<Record<string, unknown>>,
      profile.skills as unknown as Record<string, string[]>,
      tailored
    )

    await this.tailorRepo.create({
      userId,
      companyName: input.company,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      tailoredData: { jobTitle: input.jobTitle, company: input.company, original: profile, tailored, latex },
    })

    return { jobTitle: input.jobTitle, company: input.company, original: profile, tailored, latex }
  }
}
