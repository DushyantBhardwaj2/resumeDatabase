export interface HistoryTailoredEntry {
  id?: string
  vaultBullets?: Array<{ id: string; text?: string }>
}

export interface HistoryTailoredData {
  jobTitle?: string
  company?: string
  original: Record<string, unknown>
  tailored?: {
    experience?: HistoryTailoredEntry[]
    projects?: HistoryTailoredEntry[]
  }
}

export interface HistoryItemResponse {
  id: string
  companyName?: string
  jobTitle?: string
  jobDescription?: string
  tailoredData: HistoryTailoredData
  createdAt?: string
}
