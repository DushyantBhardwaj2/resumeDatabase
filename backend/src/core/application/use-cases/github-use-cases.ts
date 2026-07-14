import type { IGitHubAnalyzer } from "../ports/github-analyzer"
import type { IProjectRepository } from "../../domain/repositories"
import type { DomainMemoryAction, DomainBullet } from "../../domain/entities"

export class GithubUseCases {
  constructor(
    private githubAnalyzer: IGitHubAnalyzer,
    private projectRepo: IProjectRepository,
  ) {}

  async analyze(url: string) {
    return this.githubAnalyzer.analyze(url)
  }

  async importRepo(url: string, userId: string): Promise<{ actions: DomainMemoryAction[] }> {
    const analysis = await this.githubAnalyzer.analyze(url)

    const techStack = [
      ...Object.keys(analysis.languages),
      ...analysis.techStack.map((t) => t.name),
      ...analysis.frameworks.map((f) => f.name),
    ]

    const bullets = [
      ...analysis.recentCommits.map((c) => c.message),
      ...(analysis.readme ? [analysis.readme.slice(0, 200)] : []),
    ].slice(0, 10)

    const action: DomainMemoryAction = {
      type: "CREATE_PROJECT" as const,
      project: {
        userId,
        title: analysis.name,
        url: analysis.fullName ? `https://github.com/${analysis.fullName}` : undefined,
        githubUrl: `https://github.com/${analysis.fullName}`,
        readme: analysis.readme?.slice(0, 3000),
        languages: Object.keys(analysis.languages),
        topics: analysis.topics,
        commitCount: analysis.commitCount,
        dependencies: [analysis.packageJson ? JSON.stringify(Object.keys((analysis.packageJson as any)?.dependencies ?? {})) : "", analysis.goMod ?? "", analysis.requirementsTxt ?? ""].filter(Boolean),
        techStack,
        tags: [...analysis.topics, ...Object.keys(analysis.languages), ...analysis.techStack.map((t) => t.name)],
        source: { type: "GITHUB", importedAt: new Date().toISOString() },
        bullets: bullets.map((text, i) => ({
          id: crypto.randomUUID(),
          text,
          order: i,
          isAIGenerated: true,
          parentType: "project" as const,
          parentId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      },
    }

    return { actions: [action] }
  }
}
