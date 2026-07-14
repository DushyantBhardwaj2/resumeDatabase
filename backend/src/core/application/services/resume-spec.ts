import type { IResumeSpecEngine, FilteredSelections } from "../ports/resume-spec"
import type { ResumeSpec, ResumeSelection } from "../../../shared"

const DEFAULT_SPECS: Record<string, ResumeSpec> = {
  "ats-clean": {
    sections: {
      experience: { min: 1, max: 2, maxBullets: 4 },
      projects: { max: 2, maxBullets: 3 },
      education: { max: 1, required: true },
      skills: { priority: [], maxPerGroup: 10, max: 20 },
      certificates: { max: 2 },
    },
    sectionOrder: ["education", "experience", "projects", "skills", "certificates"],
    pageLimit: 1,
  },
  "modern": {
    sections: {
      experience: { min: 1, max: 3, maxBullets: 5 },
      projects: { max: 3, maxBullets: 4 },
      education: { max: 1, required: true },
      skills: { priority: [], maxPerGroup: 8, max: 25 },
      certificates: { max: 3 },
    },
    sectionOrder: ["experience", "projects", "education", "skills", "certificates"],
    pageLimit: 1,
  },
  "compact": {
    sections: {
      experience: { min: 1, max: 4, maxBullets: 6 },
      projects: { max: 4, maxBullets: 4 },
      education: { max: 1, required: true },
      skills: { priority: [], maxPerGroup: 12, max: 30 },
      certificates: { max: 4 },
    },
    sectionOrder: ["experience", "projects", "education", "skills"],
    pageLimit: 1,
  },
  "nsut-canonical": {
    sections: {
      experience: { min: 1, max: 3, maxBullets: 5 },
      projects: { max: 3, maxBullets: 4 },
      education: { max: 1, required: true },
      skills: { priority: [], maxPerGroup: 10, max: 25 },
      certificates: { max: 3 },
    },
    sectionOrder: ["education", "experience", "projects", "skills", "certificates"],
    pageLimit: 2,
  },
}

export class ResumeSpecEngine implements IResumeSpecEngine {
  apply(spec: ResumeSpec, selections: ResumeSelection[]): FilteredSelections {
    const experienceRules = spec.sections.experience
    const projectRules = spec.sections.projects
    const educationRules = spec.sections.education

    let experience = selections
      .filter((s) => s.entryType === "experience")
      .sort((a, b) => a.rank - b.rank)
      .slice(0, experienceRules.max)
      .map((s) => ({
        ...s,
        selectedBulletIds: s.selectedBulletIds.slice(0, experienceRules.maxBullets),
      }))

    const projects = selections
      .filter((s) => s.entryType === "project")
      .sort((a, b) => a.rank - b.rank)
      .slice(0, projectRules.max)
      .map((s) => ({
        ...s,
        selectedBulletIds: s.selectedBulletIds.slice(0, projectRules.maxBullets),
      }))

    let education = selections
      .filter((s) => s.entryType === "education")
      .sort((a, b) => a.rank - b.rank)
      .slice(0, educationRules.max)

    if (educationRules.required && education.length === 0 && experience.length > 0) {
      education = []
    }

    const sectionOrder = spec.sectionOrder.filter(
      (section) =>
        (section === "experience" && experience.length >= experienceRules.min) ||
        (section === "projects" && projects.length > 0) ||
        (section === "education" && (education.length > 0 || !educationRules.required)) ||
        !["experience", "projects", "education"].includes(section)
    )

    return { experience, projects, education, sectionOrder }
  }

  getDefaultSpec(templateId: string): ResumeSpec {
    return DEFAULT_SPECS[templateId] ?? DEFAULT_SPECS["ats-clean"]
  }
}
