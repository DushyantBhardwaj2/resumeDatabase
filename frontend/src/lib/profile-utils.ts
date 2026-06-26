interface ProfileData {
  contact?: { phone?: string | null; linkedin?: string | null; github?: string | null; portfolio?: string | null } | null
  education?: Array<unknown> | null
  experience?: Array<unknown> | null
  projects?: Array<unknown> | null
  skills?: { languages?: string[]; frameworks?: string[]; tools?: string[] } | null
  githubUsername?: string | null
}

export function computeCompleteness(profile: ProfileData): number {
  let score = 0
  let total = 0
  if (profile?.contact) {
    const c = profile.contact
    if (c.phone) score++
    if (c.linkedin) score++
    if (c.github) score++
    if (c.portfolio) score++
    total += 4
  }
  if (profile?.education && profile.education.length > 0) { score += 2; total += 2 }
  if (profile?.experience && profile.experience.length > 0) { score += 3; total += 3 }
  if (profile?.projects && profile.projects.length > 0) { score += 2; total += 2 }
  if (profile?.skills && (profile.skills.languages?.length || profile.skills.frameworks?.length || profile.skills.tools?.length)) { score += 2; total += 2 }
  if (profile?.githubUsername) { score++; total++ }
  return total > 0 ? Math.round((score / total) * 100) : 0
}

export function completenessColor(score: number): string {
  if (score >= 80) return "text-success"
  if (score >= 50) return "text-warning"
  return "text-error"
}

export function completenessBg(score: number): string {
  if (score >= 80) return "bg-success"
  if (score >= 50) return "bg-warning"
  return "bg-error"
}

export function completenessHint(score: number): string {
  if (score >= 80) return "Great job! Your profile is looking strong."
  if (score >= 50) return "Good start. Add more sections to stand out."
  return "Complete your profile to get the most out of Resumint."
}
