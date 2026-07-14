import type { IProfileRepository, ITailoredResumeRepository, IResumeDraftRepository } from "../core/domain/repositories"
import type { IAIService, IPDFParser, ILatexTemplateFiller } from "../core/application/ports"
import type { IKnowledgeBaseService } from "../core/application/ports/knowledge-base"
import type { IRetrieverService } from "../core/application/ports/retriever"
import type { IResumeSpecEngine } from "../core/application/ports/resume-spec"
import type { IConfidenceService } from "../core/application/ports/system-confidence"
import type { IResumeFitService } from "../core/application/ports/resume-fit"
import type { IGitHubAnalyzer } from "../core/application/ports/github-analyzer"
import { ProfileUseCases } from "../core/application/use-cases/profile-use-cases"
import { ResumeUseCases } from "../core/application/use-cases/resume-use-cases"
import { AiUseCases } from "../core/application/use-cases/ai-use-cases"
import type { SectionConfig } from "../core/application/use-cases/ai-use-cases"
import { getBulletSelectorPrompt } from "../infrastructure/prompts"
import { parsedResumeSchema, bulletSelectionSchema } from "../shared"
import { HistoryUseCases } from "../core/application/use-cases/history-use-cases"
import { GithubUseCases } from "../core/application/use-cases/github-use-cases"
import { ChatUseCases } from "../core/application/use-cases/chat-use-cases"
import { MemoryUseCases } from "../core/application/use-cases/memory-use-cases"
import { DraftUseCases } from "../core/application/use-cases/draft-use-cases"
import { ResumeEngine } from "../core/application/use-cases/resume-engine"
import { ParseUseCases } from "../core/application/use-cases/parse-use-cases"
import { KbUseCases } from "../core/application/use-cases/kb-use-cases"
import { RetrieverService } from "../core/application/services/retriever"
import { ResumeSpecEngine } from "../core/application/services/resume-spec"
import { ConfidenceService } from "../core/application/services/system-confidence"
import { ResumeFitService } from "../core/application/services/resume-fit"
import { ProfileRepository } from "../infrastructure/persistence/profile-repository"
import { TailoredResumeRepository } from "../infrastructure/persistence/tailored-resume-repository"
import { ChatRepository } from "../infrastructure/persistence/chat-repository"
import { OpenCodeZenAIService } from "../infrastructure/ai"
import { PDFParser } from "../infrastructure/pdf"
import { LatexTemplateFiller } from "../infrastructure/latex/latex-template"
import { GENERATE_BULLETS, CHAT_INTENT_PARSER, PARSE_RESUME, MEMORY_EXTRACT } from "../infrastructure/prompts"
import { SECTION_SCHEMAS } from "../shared"
import { ExperienceRepository } from "../infrastructure/persistence/experience-repository"
import { ProjectRepository } from "../infrastructure/persistence/project-repository"
import { EducationRepository } from "../infrastructure/persistence/education-repository"
import { SkillRepository } from "../infrastructure/persistence/skill-repository"
import { CertificateRepository } from "../infrastructure/persistence/certificate-repository"
import { AchievementRepository } from "../infrastructure/persistence/achievement-repository"
import { BulletRepository } from "../infrastructure/persistence/bullet-repository"
import { DraftRepository } from "../infrastructure/persistence/draft-repository"
import { MemoryRepository } from "../infrastructure/persistence/memory-repository"
import { KnowledgeBaseService } from "../infrastructure/knowledge-base"
import { GitHubAnalyzer } from "../infrastructure/github/github-analyzer"

class Container {
  private _profileRepo?: IProfileRepository
  private _tailoredRepo?: ITailoredResumeRepository
  private _chatRepo?: ChatRepository
  private _aiService?: IAIService
  private _pdfParser?: IPDFParser
  private _latexTemplate?: ILatexTemplateFiller
  private _retriever?: IRetrieverService
  private _specEngine?: IResumeSpecEngine
  private _confidence?: IConfidenceService
  private _resumeFit?: IResumeFitService
  private _kb?: IKnowledgeBaseService
  private _ghAnalyzer?: IGitHubAnalyzer
  private _draftRepo?: IResumeDraftRepository
  private _experienceRepo?: ExperienceRepository
  private _projectRepo?: ProjectRepository
  private _educationRepo?: EducationRepository
  private _skillRepo?: SkillRepository
  private _certificateRepo?: CertificateRepository
  private _achievementRepo?: AchievementRepository
  private _bulletRepo?: BulletRepository
  private _memoryRepo?: MemoryRepository

  private _profileUseCases?: ProfileUseCases
  private _resumeUseCases?: ResumeUseCases
  private _aiUseCases?: AiUseCases
  private _historyUseCases?: HistoryUseCases
  private _githubUseCases?: GithubUseCases
  private _chatUseCases?: ChatUseCases
  private _memoryUseCases?: MemoryUseCases
  private _draftUseCases?: DraftUseCases
  private _resumeEngine?: ResumeEngine
  private _parseUseCases?: ParseUseCases
  private _kbUseCases?: KbUseCases

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
        getBulletSelectorPrompt,
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
      this._historyUseCases = new HistoryUseCases(this.draftRepo)
    }
    return this._historyUseCases
  }

  get githubUseCases(): GithubUseCases {
    if (!this._githubUseCases) {
      this._githubUseCases = new GithubUseCases(this.ghAnalyzer, this.projectRepo)
    }
    return this._githubUseCases
  }

  get chatUseCases(): ChatUseCases {
    if (!this._chatUseCases) {
      this._chatUseCases = new ChatUseCases(
        this.aiService,
        this.retriever,
        this.kb,
        this.confidence,
        this.chatRepository,
        CHAT_INTENT_PARSER,
        MEMORY_EXTRACT,
      )
    }
    return this._chatUseCases
  }

  get memoryUseCases(): MemoryUseCases {
    if (!this._memoryUseCases) {
      this._memoryUseCases = new MemoryUseCases(
        this.experienceRepo,
        this.projectRepo,
        this.educationRepo,
        this.skillRepo,
        this.certificateRepo,
        this.achievementRepo,
        this.bulletRepo,
        this.retriever,
        this.memoryRepo,
      )
    }
    return this._memoryUseCases
  }

  get draftUseCases(): DraftUseCases {
    if (!this._draftUseCases) {
      this._draftUseCases = new DraftUseCases(
        this.draftRepo,
        this.experienceRepo,
        this.projectRepo,
        this.educationRepo,
        this.specEngine,
        this.retriever,
        this.aiService,
        this.kb.getCurrentVersion(),
      )
    }
    return this._draftUseCases
  }

  get resumeEngine(): ResumeEngine {
    if (!this._resumeEngine) {
      this._resumeEngine = new ResumeEngine(
        this.aiService,
        this.retriever,
        this.specEngine,
        this.resumeFit,
        this.kb,
        this.draftRepo,
      )
    }
    return this._resumeEngine
  }

  get parseUseCases(): ParseUseCases {
    if (!this._parseUseCases) {
      this._parseUseCases = new ParseUseCases(this.pdfParser, this.aiService, PARSE_RESUME)
    }
    return this._parseUseCases
  }

  get kbUseCases(): KbUseCases {
    if (!this._kbUseCases) {
      this._kbUseCases = new KbUseCases(this.kb)
    }
    return this._kbUseCases
  }

  private get retriever(): IRetrieverService {
    if (!this._retriever) {
      this._retriever = new RetrieverService(
        this.experienceRepo,
        this.projectRepo,
        this.educationRepo,
        this.skillRepo,
        this.certificateRepo,
        this.achievementRepo,
      )
    }
    return this._retriever
  }

  private get specEngine(): IResumeSpecEngine {
    if (!this._specEngine) this._specEngine = new ResumeSpecEngine()
    return this._specEngine
  }

  private get confidence(): IConfidenceService {
    if (!this._confidence) this._confidence = new ConfidenceService()
    return this._confidence
  }

  private get resumeFit(): IResumeFitService {
    if (!this._resumeFit) this._resumeFit = new ResumeFitService(this.draftRepo)
    return this._resumeFit
  }

  private get kb(): IKnowledgeBaseService {
    if (!this._kb) {
      this._kb = new KnowledgeBaseService()
    }
    return this._kb
  }

  private get ghAnalyzer(): IGitHubAnalyzer {
    if (!this._ghAnalyzer) {
      this._ghAnalyzer = new GitHubAnalyzer()
    }
    return this._ghAnalyzer
  }

  private get draftRepo(): IResumeDraftRepository {
    if (!this._draftRepo) {
      this._draftRepo = new DraftRepository()
    }
    return this._draftRepo
  }

  // ── Infrastructure Getters ────────────────────────────────────────────────

  private get profileRepo(): IProfileRepository {
    if (!this._profileRepo) this._profileRepo = new ProfileRepository()
    return this._profileRepo
  }

  private get tailoredRepo(): ITailoredResumeRepository {
    if (!this._tailoredRepo) this._tailoredRepo = new TailoredResumeRepository()
    return this._tailoredRepo
  }

  get chatRepository(): ChatRepository {
    if (!this._chatRepo) this._chatRepo = new ChatRepository()
    return this._chatRepo
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

  private get experienceRepo(): ExperienceRepository {
    if (!this._experienceRepo) this._experienceRepo = new ExperienceRepository()
    return this._experienceRepo
  }

  private get projectRepo(): ProjectRepository {
    if (!this._projectRepo) this._projectRepo = new ProjectRepository()
    return this._projectRepo
  }

  private get educationRepo(): EducationRepository {
    if (!this._educationRepo) this._educationRepo = new EducationRepository()
    return this._educationRepo
  }

  private get skillRepo(): SkillRepository {
    if (!this._skillRepo) this._skillRepo = new SkillRepository()
    return this._skillRepo
  }

  private get certificateRepo(): CertificateRepository {
    if (!this._certificateRepo) this._certificateRepo = new CertificateRepository()
    return this._certificateRepo
  }

  private get achievementRepo(): AchievementRepository {
    if (!this._achievementRepo) this._achievementRepo = new AchievementRepository()
    return this._achievementRepo
  }

  private get bulletRepo(): BulletRepository {
    if (!this._bulletRepo) this._bulletRepo = new BulletRepository()
    return this._bulletRepo
  }

  private get memoryRepo(): MemoryRepository {
    if (!this._memoryRepo) this._memoryRepo = new MemoryRepository()
    return this._memoryRepo
  }
}

export type { Container }
export const container = new Container()
