// Pure filtering logic for compile-live — separates selection semantics from the HTTP handler.
//
// Semantics:
//  - key absent  (undefined) →  include all bullets (no selection made yet)
//  - key present with array  →  use exactly those bullet IDs (empty array = exclude all)

export type VaultBullet = { id: string; text: string }
export type HasVaultBullets = { id?: string; vaultBullets?: VaultBullet[] }
export type Selections = Record<string, string[]>

function filterEntry<T extends HasVaultBullets>(entry: T, selection: string[] | undefined): T {
  if (!entry.vaultBullets?.length) return entry
  if (selection === undefined) return entry
  const filteredBullets = entry.vaultBullets.filter((b) => selection.includes(b.id))
  return { ...entry, vaultBullets: filteredBullets }
}

export function filterExperienceBySelection(
  experience: HasVaultBullets[],
  selectedBulletIds: Selections | null | undefined
): HasVaultBullets[] {
  return (experience || []).map((exp) =>
    filterEntry(exp, selectedBulletIds?.[exp.id || ''])
  )
}

export function filterProjectsBySelection(
  projects: HasVaultBullets[],
  selectedBulletIds: Selections | null | undefined
): HasVaultBullets[] {
  return (projects || []).map((proj) =>
    filterEntry(proj, selectedBulletIds?.[proj.id || ''])
  )
}
