import type { Profile, VaultBullet } from "../../domain/entities"

// ── Chat Intent Types ─────────────────────────────────────────────────────────

export type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export type OnboardingPhase =
  | "GREETING"
  | "AWAITING_RESUME_OR_TEXT"
  | "PROCESSING_UPLOAD"
  | "REVIEW_EXPERIENCE"
  | "REVIEW_PROJECTS"
  | "REVIEW_SKILLS"
  | "REVIEW_CONTACT_AND_CERTS"
  | "COMPLETE"

export type TargetWidget =
  | "CONTACT"
  | "EXPERIENCE"
  | "PROJECTS"
  | "SKILLS"
  | "CERTIFICATES"
  | "REVIEW"
  | "UPLOAD_DROPZONE"
  | "PROFILE_GENERATOR"
  | null

export type ChatIntent = "PROVIDE_DATA" | "NAVIGATE" | "GENERAL_CHAT" | "GENERATE_PROFILE_DATA"

// Phase 6: Revised intent classification
export type ChatIntentV2 =
  | "CREATE_MEMORY"
  | "UPDATE_MEMORY"
  | "DELETE_MEMORY"
  | "CREATE_RESUME"
  | "SEARCH_MEMORY"
  | "GENERAL_CHAT"
  | "PROVIDE_DATA"
  | "NAVIGATE"
  | "GENERATE_PROFILE_DATA"

export type ChatInteractRequest = {
  messages: ChatMessage[]
  currentState?: {
    phase: OnboardingPhase
    profileData?: Partial<Profile>
  }
}

export type ChatInteractResponse = {
  reply: string
  intent: ChatIntent
  targetWidget: TargetWidget
  extractedData?: Record<string, unknown>
}

// Phase 6: Revised response with MemoryAction support
import type { EntrySummary, MergeAction } from "../../../shared"
import type { DomainMemoryAction } from "../../domain/entities"

export type ChatInteractResponseV2 = {
  reply: string
  type: "text" | "proposal-cards" | "selection" | "search-results" | "merge-suggestion"
  intent: ChatIntentV2
  actions?: DomainMemoryAction[]
  selections?: SelectionV2[]
  searchResults?: EntrySummary[]
  mergeSuggestion?: MergeAction
}

export interface SelectionV2 {
  entryId: string
  entryType: "experience" | "project" | "education"
  confidence: number
  rank: number
  rationale: string
  selectedBulletIds: string[]
}

export interface Selection {
  entryId: string
  entryType: "experience" | "project" | "education"
  confidence: number
  rank: number
  rationale: string
  selectedBulletIds: string[]
}

export interface ChatInteractRequestV2 {
  message: string
  activeDraftId?: string
}

// ── Vault Expansion Types ─────────────────────────────────────────────────────

export type VaultExpansionRequest = {
  type: "PROJECT" | "EXPERIENCE"
  title: string
  rawDescription: string
}

export type VaultExpansionResponse = {
  vaultBullets: VaultBullet[]
}

// ── Bullet Selection Types ────────────────────────────────────────────────────

export type BulletSelectionRequest = {
  jobDescription: string
  profile: Profile
}

export type BulletSelectionResponse = {
  selectedExperienceIds: string[]
  selectedProjectIds: string[]
  selections: Record<string, string[]> // itemId -> selected bullet IDs
  skills?: { languages: string[]; frameworks: string[]; tools: string[] }
  rationale: string
}
