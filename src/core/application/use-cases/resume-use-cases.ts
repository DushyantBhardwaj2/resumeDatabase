import type { Profile, TailoredOutput } from "../../domain/entities"
import type { IProfileRepository, ITailoredResumeRepository } from "../../domain/repositories"
import type { IAIService, ISchema } from "../ports/ai-service"
import type { IPDFParser } from "../ports/pdf-parser"
import type { ILatexTemplateFiller } from "../ports/latex-compiler"

export class ResumeUseCases {
  constructor(
    private profileRepo: IProfileRepository,
    private tailorRepo: ITailoredResumeRepository,
    private aiService: IAIService,
    private pdfParser: IPDFParser,
    private latexTemplate: ILatexTemplateFiller,
    private parsePrompt: string,
    private parseSchema: ISchema<unknown>,
    private tailorPrompt: string,
    private tailorSchema: ISchema<unknown>
  ) {}

  async parseResume(buffer: Buffer): Promise<{ rawText: string; parsed: Profile }> {
    const rawText = await this.pdfParser.extractText(buffer)
    const parsed = await this.aiService.generateStructuredData(this.parsePrompt, rawText, this.parseSchema)
    return { rawText, parsed: parsed as unknown as Profile }
  }

  async tailorResume(
    userId: string,
    input: { jobTitle: string; company: string; jobDescription: string }
  ): Promise<{ jobTitle: string; company: string; original: Profile; tailored: TailoredOutput; latex: string }> {
    const profile = await this.profileRepo.findByUserId(userId)
    if (!profile) throw new Error("Profile not found. Complete onboarding first.")

    const userContent = JSON.stringify({ ...input, candidateProfile: profile })
    const tailored = await this.aiService.generateStructuredData(this.tailorPrompt, userContent, this.tailorSchema)

    const latex = this.latexTemplate.fill(
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
