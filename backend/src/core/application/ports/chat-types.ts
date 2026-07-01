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
  selections: Record<string, string[]> // itemId -> selected bullet IDs
  rationale: string
}
