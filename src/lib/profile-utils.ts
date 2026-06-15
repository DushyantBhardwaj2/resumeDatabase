type ProfileData = {
  contact: Record<string, unknown> | null
  education: Array<Record<string, unknown>> | null
  experience: Array<Record<string, unknown>> | null
  projects: Array<Record<string, unknown>> | null
  skills: Record<string, string[]> | null
}

export function computeCompleteness(profile: ProfileData): number {
  const contact = profile.contact ?? {}
  const education = profile.education ?? []
  const experience = profile.experience ?? []
  const projects = profile.projects ?? []
  const skills = profile.skills ?? {}

  const fields: unknown[] = [
    contact.phone, contact.linkedin, contact.github, contact.portfolio,
    ...education.flatMap((e) => [e.school, e.degree]),
    ...experience.flatMap((e) => [e.company, e.role]),
    ...projects.flatMap((p) => [p.title]),
    ...Object.values(skills).flat().filter(Boolean),
  ]

  const total = 40
  const filled = fields.filter(Boolean).length
  return Math.min(Math.round((filled / total) * 100), 100)
}

export function completenessColor(score: number): string {
  if (score >= 70) return "text-green-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

export function completenessBg(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export function completenessHint(score: number): string {
  if (score < 40) return "Add more details to your profile to get started."
  if (score < 70) return "You're making progress! Fill in remaining sections."
  return "Great job! Your profile is nearly complete."
}
