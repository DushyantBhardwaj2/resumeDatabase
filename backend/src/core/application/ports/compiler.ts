export interface CompileStatus {
  status: "queued" | "compiling" | "ready" | "error"
  jobId?: string
  pdfCacheKey?: string
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface ICompilerService {
  compile(draftId: string): Promise<{ jobId: string }>
  getStatus(jobId: string): Promise<CompileStatus>
  getResult(jobId: string): Promise<Buffer | null>
}
