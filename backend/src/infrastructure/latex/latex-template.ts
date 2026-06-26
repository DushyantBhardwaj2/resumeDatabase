import { readFileSync, existsSync } from "fs"
import { join } from "path"
import type { ILatexTemplateFiller, TemplateConfig } from "../../core/application/ports/latex-compiler"

type Contact = Record<string, unknown>
type Education = Array<Record<string, unknown>>
type Experience = Array<Record<string, unknown>>
type Projects = Array<Record<string, unknown>>
type Skills = Record<string, string[]>

type TailoredData = {
  experience: Array<{ company: string; role: string; vaultBullets?: Array<{ id: string; text: string; keywords?: string[] }>; bullets?: string[] }>
  projects: Array<{ title: string; techStack: string[]; vaultBullets?: Array<{ id: string; text: string; keywords?: string[] }>; bullets?: string[] }>
  skills: { languages: string[]; frameworks: string[]; tools: string[] }
}

function getBulletTexts(item: { vaultBullets?: Array<{ id: string; text: string; keywords?: string[] }>; bullets?: string[] }): string[] {
  if (item.vaultBullets && item.vaultBullets.length > 0) {
    return item.vaultBullets.map(b => b.text)
  }
  return item.bullets || []
}

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/\$/g, "\\$")
    .replace(/_/g, "\\_")
    .replace(/&/g, "\\&")
    .replace(/#/g, "\\#")
    .replace(/%/g, "\\%")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
}

function bulletLine(b: string): string {
  return `        \\item ${esc(b)}`
}

function stripSection(tex: string, sectionName: string): string {
  const start = tex.indexOf(`\\resheading{${sectionName}}`)
  if (start === -1) return tex
  const end = tex.indexOf("\\resheading{", start + 1)
  const before = tex.slice(0, start)
  const after = end === -1 ? "" : tex.slice(end)
  return before + after
}

export class LatexTemplateFiller implements ILatexTemplateFiller {
  private configs: Map<string, TemplateConfig> = new Map()
  private templatesDir: string

  constructor() {
    this.templatesDir = join(__dirname, "templates")
  }

  getTemplateConfig(templateId: string): TemplateConfig {
    if (this.configs.has(templateId)) {
      return this.configs.get(templateId)!
    }
    const configPath = join(this.templatesDir, templateId, "config.json")
    if (!existsSync(configPath)) {
      throw new Error(`Template "${templateId}" not found at ${configPath}`)
    }
    const config: TemplateConfig = JSON.parse(readFileSync(configPath, "utf-8"))
    this.configs.set(templateId, config)
    return config
  }

  fill(
    templateId: string,
    contact: Contact | null,
    education: Education | null,
    experience: Experience | null,
    projects: Projects | null,
    skills: Skills | null,
    tailored: unknown
  ): string {
    const config = this.getTemplateConfig(templateId)
    const texPath = join(this.templatesDir, templateId, "template.tex")
    let tex = readFileSync(texPath, "utf-8")

    const data = tailored as TailoredData
    const safeContact = contact || {} as Contact
    const safeEducation = education || []
    const safeExperience = experience || []
    const safeProjects = projects || []
    const safeSkills = skills || { languages: [], frameworks: [], tools: [] }

    const name = typeof safeContact.name === "string" ? safeContact.name : ""
    const phone = typeof safeContact.phone === "string" ? safeContact.phone : ""
    const email = typeof safeContact.email === "string" ? safeContact.email : ""
    const linkedin = typeof safeContact.linkedin === "string" ? safeContact.linkedin : ""
    const leetcode = typeof safeContact.leetcode === "string" ? safeContact.leetcode : ""
    const github = typeof safeContact.github === "string" ? safeContact.github : ""

    tex = tex.replace(/\{\{FULL_NAME\}\}/g, esc(name))
    tex = tex.replace(/\{\{PHONE\}\}/g, esc(phone))
    tex = tex.replace(/\{\{EMAIL\}\}/g, esc(email))
    tex = tex.replace(/\{\{EMAIL_DISPLAY\}\}/g, esc(email))
    tex = tex.replace(/\{\{LINKEDIN_URL\}\}/g, linkedin)
    tex = tex.replace(/\{\{LEETCODE_URL\}\}/g, leetcode || "https://leetcode.com")
    tex = tex.replace(/\{\{GITHUB_URL\}\}/g, github)

    // NSUT_logo.png is served from each template directory and copied to the compile
    // temp directory by the compile-live endpoint. Keep the includegraphics line.

    const eduConfig = config.placeholders.education
    for (let i = 1; i <= eduConfig.maxEntries; i++) {
      const entry = safeEducation[i - 1]
      if (entry) {
        tex = tex.replace(new RegExp(`\\{\\{EDU_DEGREE_${i}\\}\\}`, "g"), esc(String(entry.degree ?? "")))
        tex = tex.replace(new RegExp(`\\{\\{EDU_YEAR_${i}\\}\\}`, "g"), esc(String(entry.yearRange ?? "")))
        tex = tex.replace(new RegExp(`\\{\\{EDU_INSTITUTION_${i}\\}\\}`, "g"), esc(String(entry.school ?? "")))
        tex = tex.replace(new RegExp(`\\{\\{EDU_SCORE_${i}\\}\\}`, "g"), esc(String(entry.gpa ?? "")))
      } else {
        const rowPattern = new RegExp(
          `\\\\textbf\\{\\{\\{EDU_DEGREE_${i}\\}\\}\\}.*\\\\\\\\\\\\\\n?(?=\\\\textbf\\{\\{\\{EDU_DEGREE_${i + 1}\\}\\}|\\\\end\\{tabular\\*\\})`,
          "g"
        )
        tex = tex.replace(rowPattern, "")
      }
    }

    const expConfig = config.placeholders.experience
    const tailoredExperience = data?.experience || []
    const maxExpEntries = Math.min(expConfig.maxEntries, tailoredExperience.length, safeExperience.length || tailoredExperience.length)
    for (let i = 1; i <= expConfig.maxEntries; i++) {
      const exp: Record<string, unknown> = tailoredExperience[i - 1] || safeExperience[i - 1] || {}
      if (Object.keys(exp).length > 0) {
        const title = `${exp.role || ""} -- ${exp.company || ""}`
        tex = tex.replace(new RegExp(`\\{\\{EXP_TITLE_${i}\\}\\}`, "g"), esc(title))
        const dates = exp.dates
          ? esc(String(exp.dates))
          : exp.startDate
            ? esc(`${String(exp.startDate)}${exp.endDate ? ` -- ${String(exp.endDate)}"` : ""}`)
            : ""
        tex = tex.replace(new RegExp(`\\{\\{EXP_DATES_${i}\\}\\}`, "g"), dates)
        const tech = (exp.techStack as string[]) || []
        tex = tex.replace(
          new RegExp(`\\{\\{EXP_TECHSTACK_${i}\\}\\}`, "g"),
          esc(Array.isArray(tech) ? tech.join(", ") : "")
        )
        const expTexts = getBulletTexts(exp as Parameters<typeof getBulletTexts>[0]).slice(0, expConfig.maxBullets)
        for (let m = 1; m <= expConfig.maxBullets; m++) {
          const bullet = expTexts[m - 1]
          tex = tex.replace(
            new RegExp(`\\{\\{EXP_BULLET_${i}_${m}\\}\\}`, "g"),
            bullet ? bulletLine(bullet) : ""
          )
        }
      } else {
        const blockPattern = new RegExp(
          `%% --- Experience Entry ${i} ---[\\s\\S]*?(?=%% --- Experience Entry ${i + 1}|\\\\end\\{itemize\\}|%% --- PROJECTS)`,
          "g"
        )
        tex = tex.replace(blockPattern, "")
      }
    }

    const projConfig = config.placeholders.projects
    const tailoredProjects = data?.projects || []
    for (let i = 1; i <= projConfig.maxEntries; i++) {
      const proj: Record<string, unknown> = tailoredProjects[i - 1] || safeProjects[i - 1] || {}
      if (Object.keys(proj).length > 0) {
        tex = tex.replace(new RegExp(`\\{\\{PROJ_NAME_${i}\\}\\}`, "g"), esc(String(proj.title ?? "")))
        const dates = proj.dates || proj.yearRange || ""
        tex = tex.replace(new RegExp(`\\{\\{PROJ_DATES_${i}\\}\\}`, "g"), esc(String(dates)))
        const purpose = proj.purpose || ""
        tex = tex.replace(new RegExp(`\\{\\{PROJ_PURPOSE_${i}\\}\\}`, "g"), esc(String(purpose)))
        const tech = (proj.techStack as string[]) || []
        tex = tex.replace(
          new RegExp(`\\{\\{PROJ_TECHSTACK_${i}\\}\\}`, "g"),
          esc(Array.isArray(tech) ? tech.join(", ") : "")
        )
        const projTexts = getBulletTexts(proj as Parameters<typeof getBulletTexts>[0]).slice(0, projConfig.maxBullets)
        for (let m = 1; m <= projConfig.maxBullets; m++) {
          const bullet = projTexts[m - 1]
          tex = tex.replace(
            new RegExp(`\\{\\{PROJ_BULLET_${i}_${m}\\}\\}`, "g"),
            bullet ? bulletLine(bullet) : ""
          )
        }
        const ghUrl = String(proj.url ?? "")
        tex = tex.replace(new RegExp(`\\{\\{PROJ_GITHUB_URL_${i}\\}\\}`, "g"), ghUrl)
        tex = tex.replace(new RegExp(`\\{\\{PROJ_GITHUB_LABEL_${i}\\}\\}`, "g"), ghUrl ? "GitHub" : "")
      } else {
        const blockPattern = new RegExp(
          `%% --- Project Entry ${i} ---[\\s\\S]*?(?=%% --- Project Entry ${i + 1}|%% --- Add more project|\\\\end\\{itemize\\}|%% --- TECHNICAL SKILLS)`,
          "g"
        )
        tex = tex.replace(blockPattern, "")
      }
    }

    const hasExtras = tex.includes("EXTRA-CURRICULAR ACTIVITIES")
    if (hasExtras) {
      tex = stripSection(tex, "EXTRA-CURRICULAR ACTIVITIES \\& ACHIEVEMENTS")
    }

    const tailoredSkills = data?.skills || { languages: [], frameworks: [], tools: [] }
    tex = tex.replace(/\{\{SKILLS_LANGUAGES\}\}/g, esc((tailoredSkills.languages ?? safeSkills.languages ?? []).join(", ")))
    tex = tex.replace(/\{\{SKILLS_TOOLS\}\}/g, esc((tailoredSkills.tools ?? safeSkills.tools ?? []).join(", ")))
    tex = tex.replace(/\{\{SKILLS_FRAMEWORKS\}\}/g, esc((tailoredSkills.frameworks ?? safeSkills.frameworks ?? []).join(", ")))
    tex = tex.replace(/\{\{SKILLS_BACKEND\}\}/g, esc(""))
    tex = tex.replace(/\{\{SKILLS_COURSEWORK\}\}/g, esc(""))

    return tex
  }
}
