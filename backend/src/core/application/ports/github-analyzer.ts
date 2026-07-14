export interface RepoAnalysis {
  name: string
  fullName: string
  description: string | null
  readme: string
  languages: Record<string, number>
  topics: string[]
  commitCount: number
  recentCommits: { message: string; sha: string; date: string }[]
  packageJson?: Record<string, unknown>
  goMod?: string
  requirementsTxt?: string
  license: string | null
  stars: number
  forks: number
  frameworks: { name: string; confidence: number; source: string }[]
  techStack: { name: string; confidence: number; source: string }[]
  detectedArchitecture?: string
}

export interface IGitHubAnalyzer {
  analyze(url: string): Promise<RepoAnalysis>
}
