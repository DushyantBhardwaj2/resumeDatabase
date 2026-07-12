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

type Extracurricular = { id: string; title: string; description: string; date?: string | null }

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

function parseMarkdownToLatex(s: string): string {
  if (!s) return ""
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g
  const parts = s.split(regex)
  return parts.map(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return `\\textbf{${esc(boldText)}}`
    }
    if (part.startsWith('[') && part.includes('](')) {
      const closeBracket = part.indexOf('](')
      const label = part.slice(1, closeBracket)
      const url = part.slice(closeBracket + 2, -1)
      return `\\href{${url.replace(/%/g, '\\%')}}{${esc(label)}}`
    }
    return esc(part)
  }).join("")
}

function bulletLine(b: string): string {
  if (!b) return ''
  return `        \\item ${parseMarkdownToLatex(b)}`
}

function stripSection(tex: string, sectionName: string): string {
  const start = tex.indexOf(`\\resheading{${sectionName}}`)
  if (start === -1) return tex
  const end = tex.indexOf("\\resheading{", start + 1)
  const before = tex.slice(0, start)
  let after = ""
  if (end !== -1) {
    after = tex.slice(end)
  } else {
    const docEnd = tex.indexOf("\\end{document}", start)
    if (docEnd !== -1) {
      after = tex.slice(docEnd)
    }
  }
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
    tailored: unknown,
    extracurriculars?: Extracurricular[] | null
  ): string {
    const config = this.getTemplateConfig(templateId)
    const texPath = join(this.templatesDir, templateId, "template.tex")
    let tex = readFileSync(texPath, "utf-8")

    const data = (tailored as TailoredData) || {}
    const safeContact = contact || {} as Contact
    const safeEducation = education || []
    const safeExperience = experience || []
    const safeProjects = projects || []
    const safeSkills = skills || { languages: [], frameworks: [], tools: [] }
    const safeExtracurriculars = extracurriculars || []

    const getString = (val: unknown): string => {
      if (Array.isArray(val) && val.length > 0) return String(val[0])
      if (typeof val === "string") return val
      return ""
    }
    
    const getContactArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val.map(String)
      if (typeof val === 'string') return [val]
      return []
    }
    const enabledSocials = getContactArray(safeContact.enabledSocials).length > 0
      ? getContactArray(safeContact.enabledSocials)
      : ['linkedin', 'github', 'leetcode', 'portfolio']

    const name = getString(safeContact.name) || "User"
    const phone = getString(safeContact.phone)
    const email = getString(safeContact.email) || "email@example.com"
    const linkedin = getString(safeContact.linkedin)
    const leetcode = getString(safeContact.leetcode)
    const github = getString(safeContact.github)

    tex = tex.replace(/\{\{FULL_NAME\}\}/g, esc(name))
    tex = tex.replace(/\{\{PHONE\}\}/g, esc(phone))
    tex = tex.replace(/\{\{EMAIL\}\}/g, esc(email))
    tex = tex.replace(/\{\{EMAIL_DISPLAY\}\}/g, esc(email))
    tex = tex.replace(/\{\{LINKEDIN_URL\}\}/g, enabledSocials.includes('linkedin') ? linkedin : '')
    tex = tex.replace(/\{\{LEETCODE_URL\}\}/g, enabledSocials.includes('leetcode') ? leetcode : '')
    tex = tex.replace(/\{\{GITHUB_URL\}\}/g, enabledSocials.includes('github') ? github : '')

    // NSUT_logo.png is served from each template directory and copied to the compile
    // temp directory by the compile-live endpoint. Keep the includegraphics line.

    const eduConfig = config.placeholders.education
    for (let i = 1; i <= eduConfig.maxEntries; i++) {
      const entry = safeEducation[i - 1]
      if (entry) {
        tex = tex.replace(new RegExp(`\\{\\{EDU_DEGREE_${i}\\}\\}`, "g"), esc(String(entry.degree ?? "")))
        const yearRange = entry.startYear && entry.endYear
          ? `${String(entry.startYear)} -- ${String(entry.endYear)}`
          : entry.startYear
            ? String(entry.startYear)
            : entry.endYear
              ? String(entry.endYear)
              : ""
        tex = tex.replace(new RegExp(`\\{\\{EDU_YEAR_${i}\\}\\}`, "g"), esc(yearRange))
        tex = tex.replace(new RegExp(`\\{\\{EDU_INSTITUTION_${i}\\}\\}`, "g"), esc(String(entry.school ?? "")))
        tex = tex.replace(new RegExp(`\\{\\{EDU_SCORE_${i}\\}\\}`, "g"), esc(String(entry.gpa ?? "")))
      } else {
        const rowPattern = new RegExp(
          `\\\\textbf\\{\\{\\{EDU_DEGREE_${i}\\}\\}\\}.*\\\\\\\\\\n?(?=\\\\textbf\\{\\{\\{EDU_DEGREE_${i + 1}\\}\\}|\\\\end\\{tabular\\*\\})`,
          "g"
        )
        tex = tex.replace(rowPattern, "")
      }
    }

    const tailoredExperience = data?.experience || []
    const hasAnyExperience = safeExperience.length > 0 || tailoredExperience.length > 0
    if (!hasAnyExperience) {
      tex = stripSection(tex, "EXPERIENCE")
    }

    const expConfig = config.placeholders.experience
    const isTailoredMode = !!data?.experience
    const maxExpEntries = Math.min(expConfig.maxEntries, tailoredExperience.length, safeExperience.length || tailoredExperience.length)
    for (let i = 1; i <= expConfig.maxEntries; i++) {
      const exp: Record<string, unknown> = tailoredExperience[i - 1] || (isTailoredMode ? {} : safeExperience[i - 1]) || {}
      if (Object.keys(exp).length > 0) {
        const title = `${exp.role || ""} -- ${exp.company || ""}`
        tex = tex.replace(new RegExp(`\\{\\{EXP_TITLE_${i}\\}\\}`, "g"), esc(title))
        const dates = exp.dates
          ? esc(String(exp.dates))
          : exp.startDate
            ? esc(`${String(exp.startDate)}${exp.endDate ? ` -- ${String(exp.endDate)}` : ""}`)
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
          `%% --- Experience Entry ${i} ---[\\s\\S]*?(?=%% --- Experience Entry ${i + 1}|\\\\resheading\\{PROJECTS\\})`,
          "g"
        )
        tex = tex.replace(blockPattern, "")
      }
    }

    const tailoredProjects = data?.projects || []
    const hasAnyProjects = safeProjects.length > 0 || tailoredProjects.length > 0
    if (!hasAnyProjects) {
      tex = stripSection(tex, "PROJECTS")
    }

    const projConfig = config.placeholders.projects
    for (let i = 1; i <= projConfig.maxEntries; i++) {
      const proj: Record<string, unknown> = tailoredProjects[i - 1] || (isTailoredMode ? {} : safeProjects[i - 1]) || {}
      if (Object.keys(proj).length > 0) {
        tex = tex.replace(new RegExp(`\\{\\{PROJ_NAME_${i}\\}\\}`, "g"), esc(String(proj.title ?? "")))
        const dates = proj.dates
          ? esc(String(proj.dates))
          : proj.startDate
            ? esc(`${String(proj.startDate)}${proj.endDate ? ` -- ${String(proj.endDate)}` : ""}`)
            : ""
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
          `%% --- Project Entry ${i} ---[\\s\\S]*?(?=%% --- Project Entry ${i + 1}|\\\\resheading\\{TECHNICAL SKILLS\\})`,
          "g"
        )
        tex = tex.replace(blockPattern, "")
      }
    }

    const hasExtras = tex.includes("EXTRA-CURRICULAR ACTIVITIES")
    if (hasExtras) {
      if (safeExtracurriculars.length > 0) {
        const extrasBullets = safeExtracurriculars.map(ec =>
          `        \\item ${parseMarkdownToLatex(ec.title)}${ec.description ? ` — ${parseMarkdownToLatex(ec.description)}` : ''}${ec.date ? ` (${parseMarkdownToLatex(ec.date)})` : ''}`
        ).join('\n')
        tex = tex.replace(
          /\\resheading\{EXTRA-CURRICULAR ACTIVITIES \\& ACHIEVEMENTS\}[\s\S]*?(?=\\resheading\{|\\end\{document\})/,
          `\\resheading{EXTRA-CURRICULAR ACTIVITIES \\& ACHIEVEMENTS}\n      \\begin{itemize}\n${extrasBullets}\n      \\end{itemize}\n`
        )
      } else {
        tex = stripSection(tex, "EXTRA-CURRICULAR ACTIVITIES \\& ACHIEVEMENTS")
      }
    }

    const resolvedSkills = {
      languages: (data?.skills?.languages ?? safeSkills.languages ?? []),
      frameworks: (data?.skills?.frameworks ?? safeSkills.frameworks ?? []),
      tools: (data?.skills?.tools ?? safeSkills.tools ?? []),
    }
    const hasAnySkills = resolvedSkills.languages.length > 0 || resolvedSkills.frameworks.length > 0 || resolvedSkills.tools.length > 0
    if (!hasAnySkills) {
      tex = stripSection(tex, "TECHNICAL SKILLS")
    }

    tex = tex.replace(/\{\{SKILLS_LANGUAGES\}\}/g, esc(resolvedSkills.languages.join(", ")))
    tex = tex.replace(/\{\{SKILLS_TOOLS\}\}/g, esc(resolvedSkills.tools.join(", ")))
    tex = tex.replace(/\{\{SKILLS_FRAMEWORKS\}\}/g, esc(resolvedSkills.frameworks.join(", ")))
    tex = tex.replace(/\{\{SKILLS_BACKEND\}\}/g, esc(""))
    tex = tex.replace(/\{\{SKILLS_COURSEWORK\}\}/g, esc(""))

    // Remove any dangling \item lines that had their placeholder replaced with empty content
    tex = tex.replace(/^\s*\\item\s*(\\textbf\{[^}]*\}:?)?\s*$/gm, "")

    return tex
  }
}
