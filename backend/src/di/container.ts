import type { IProfileRepository, ITailoredResumeRepository, IGitHubRepoRepository } from "../core/domain/repositories"
import type { IAIService, IPDFParser, ILatexTemplateFiller } from "../core/application/ports"
import { ProfileUseCases } from "../core/application/use-cases/profile-use-cases"
import { ResumeUseCases } from "../core/application/use-cases/resume-use-cases"
import { AiUseCases } from "../core/application/use-cases/ai-use-cases"
import type { SectionConfig } from "../core/application/use-cases/ai-use-cases"
import { HistoryUseCases } from "../core/application/use-cases/history-use-cases"
import { GithubUseCases } from "../core/application/use-cases/github-use-cases"
import { ChatUseCases } from "../core/application/use-cases/chat-use-cases"
import { ProfileRepository } from "../infrastructure/persistence/profile-repository"
import { TailoredResumeRepository } from "../infrastructure/persistence/tailored-resume-repository"
import { GitHubRepoRepository } from "../infrastructure/persistence/github-repo-repository"
import { OpenCodeZenAIService } from "../infrastructure/ai"
import { PDFParser } from "../infrastructure/pdf"
import { LatexTemplateFiller } from "../infrastructure/latex/latex-template"
import { GENERATE_BULLETS, PARSE_RESUME, GITHUB_README_BULLETS, CHAT_INTENT_PARSER, VAULT_EXPANDER, BULLET_SELECTOR } from "../infrastructure/prompts"
import { SECTION_SCHEMAS, parsedResumeSchema, bulletSelectionSchema } from "@resumint/shared"
import { z } from "zod"

class Container {
  private _profileRepo?: IProfileRepository
  private _tailoredRepo?: ITailoredResumeRepository
  private _githubRepo?: IGitHubRepoRepository
  private _aiService?: IAIService
  private _pdfParser?: IPDFParser
  private _latexTemplate?: ILatexTemplateFiller
  private _aiSectionConfigs?: Record<string, SectionConfig>
  private _profileUseCases?: ProfileUseCases
  private _resumeUseCases?: ResumeUseCases
  private _aiUseCases?: AiUseCases
  private _historyUseCases?: HistoryUseCases
  private _githubUseCases?: GithubUseCases
  private _chatUseCases?: ChatUseCases

  get profileUseCases(): ProfileUseCases {
    if (!this._profileUseCases) {
      this._profileUseCases = new ProfileUseCases(this.profileRepo)
    }
    return this._profileUseCases
  }

  get resumeUseCases(): ResumeUseCases {
    if (!this._resumeUseCases) {
      this._resumeUseCases = new ResumeUseCases(
        this.profileRepo,
        this.tailoredRepo,
        this.aiService,
        this.pdfParser,
        this.latexTemplate,
        PARSE_RESUME,
        parsedResumeSchema,
        BULLET_SELECTOR,
        bulletSelectionSchema
      )
    }
    return this._resumeUseCases
  }

  get aiUseCases(): AiUseCases {
    if (!this._aiUseCases) {
      const configs: Record<string, SectionConfig> = {}
      for (const [section, prompt] of Object.entries(GENERATE_BULLETS)) {
        configs[section] = { prompt, schema: SECTION_SCHEMAS[section] }
      }
      this._aiUseCases = new AiUseCases(this.aiService, configs)
    }
    return this._aiUseCases
  }

  get historyUseCases(): HistoryUseCases {
    if (!this._historyUseCases) {
      this._historyUseCases = new HistoryUseCases(this.tailoredRepo)
    }
    return this._historyUseCases
  }

  get githubUseCases(): GithubUseCases {
    if (!this._githubUseCases) {
      this._githubUseCases = new GithubUseCases(
        this.githubRepo,
        this.profileRepo,
        this.aiService,
        GITHUB_README_BULLETS,
        z.array(z.string())
      )
    }
    return this._githubUseCases
  }

  private get profileRepo(): IProfileRepository {
    if (!this._profileRepo) this._profileRepo = new ProfileRepository()
    return this._profileRepo
  }

  private get tailoredRepo(): ITailoredResumeRepository {
    if (!this._tailoredRepo) this._tailoredRepo = new TailoredResumeRepository()
    return this._tailoredRepo
  }

  private get githubRepo(): IGitHubRepoRepository {
    if (!this._githubRepo) this._githubRepo = new GitHubRepoRepository()
    return this._githubRepo
  }

  private get aiService(): IAIService {
    if (!this._aiService) this._aiService = new OpenCodeZenAIService()
    return this._aiService
  }

  private get pdfParser(): IPDFParser {
    if (!this._pdfParser) this._pdfParser = new PDFParser()
    return this._pdfParser
  }

  get chatUseCases(): ChatUseCases {
    if (!this._chatUseCases) {
      this._chatUseCases = new ChatUseCases(
        this.aiService,
        CHAT_INTENT_PARSER,
        VAULT_EXPANDER,
        BULLET_SELECTOR
      )
    }
    return this._chatUseCases
  }

  get latexTemplate(): ILatexTemplateFiller {
    if (!this._latexTemplate) this._latexTemplate = new LatexTemplateFiller()
    return this._latexTemplate
  }

}

export type { Container }
export const container = new Container()
