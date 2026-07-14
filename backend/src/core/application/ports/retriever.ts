import type { MemoryType, EntrySummary } from "../../../shared"

export interface RetrieverSearchOptions {
  userId: string
  query: string
  types?: MemoryType[]
  maxResults?: number
  excludeIds?: string[]
  contextHint?: string
}

export type { EntrySummary }

export interface MergeDetection {
  shouldSuggest: boolean
  targetEntry: { id: string; title: string; type: MemoryType } | null
  matchScore: number
}

export interface IRetrieverService {
  search(options: RetrieverSearchOptions): Promise<EntrySummary[]>
  detectMerge(newContent: { title: string; description: string; techStack: string[] }): Promise<MergeDetection | null>
}
