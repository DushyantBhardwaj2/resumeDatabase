import type { IProfileRepository, ITailoredResumeRepository, IGitHubRepoRepository } from "../core/domain/repositories"
import type { IAIService, IPDFParser, ILatexTemplateFiller } from "../core/application/ports"
import { ProfileUseCases } from "../core/application/use-cases/profile-use-cases"
import { ResumeUseCases } from "../core/application/use-cases/resume-use-cases"
import { AiUseCases } from "../core/application/use-cases/ai-use-cases"
import { HistoryUseCases } from "../core/application/use-cases/history-use-cases"
import { ProfileRepository } from "../infrastructure/persistence/profile-repository"
import { TailoredResumeRepository } from "../infrastructure/persistence/tailored-resume-repository"
import { GitHubRepoRepository } from "../infrastructure/persistence/github-repo-repository"
import { OpenCodeZenAIService } from "../infrastructure/ai"
import { PDFParser } from "../infrastructure/pdf"
import { LatexTemplateFiller } from "../infrastructure/latex/latex-template"

class Container {
  private _profileRepo?: IProfileRepository
  private _tailoredRepo?: ITailoredResumeRepository
  private _githubRepo?: IGitHubRepoRepository
  private _aiService?: IAIService
  private _pdfParser?: IPDFParser
  private _latexTemplate?: ILatexTemplateFiller
  private _profileUseCases?: ProfileUseCases
  private _resumeUseCases?: ResumeUseCases
  private _aiUseCases?: AiUseCases
  private _historyUseCases?: HistoryUseCases

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
        this.latexTemplate
      )
    }
    return this._resumeUseCases
  }

  get aiUseCases(): AiUseCases {
    if (!this._aiUseCases) {
      this._aiUseCases = new AiUseCases(this.aiService)
    }
    return this._aiUseCases
  }

  get historyUseCases(): HistoryUseCases {
    if (!this._historyUseCases) {
      this._historyUseCases = new HistoryUseCases(this.tailoredRepo)
    }
    return this._historyUseCases
  }

  private get profileRepo(): IProfileRepository {
    if (!this._profileRepo) this._profileRepo = new ProfileRepository()
    return this._profileRepo
  }

  private get tailoredRepo(): ITailoredResumeRepository {
    if (!this._tailoredRepo) this._tailoredRepo = new TailoredResumeRepository()
    return this._tailoredRepo
  }

  get githubRepo(): IGitHubRepoRepository {
    if (!this._githubRepo) this._githubRepo = new GitHubRepoRepository()
    return this._githubRepo
  }

  get aiService(): IAIService {
    if (!this._aiService) this._aiService = new OpenCodeZenAIService()
    return this._aiService
  }

  private get pdfParser(): IPDFParser {
    if (!this._pdfParser) this._pdfParser = new PDFParser()
    return this._pdfParser
  }

  get latexTemplate(): ILatexTemplateFiller {
    if (!this._latexTemplate) this._latexTemplate = new LatexTemplateFiller()
    return this._latexTemplate
  }

}

export const container = new Container()
