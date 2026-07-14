import type { ResumeSpec, ResumeSelection } from "../../../shared"

export interface FilteredSelections {
  experience: ResumeSelection[]
  projects: ResumeSelection[]
  education: ResumeSelection[]
  sectionOrder: string[]
}

export interface IResumeSpecEngine {
  apply(spec: ResumeSpec, selections: ResumeSelection[]): FilteredSelections
  getDefaultSpec(templateId: string): ResumeSpec
}
