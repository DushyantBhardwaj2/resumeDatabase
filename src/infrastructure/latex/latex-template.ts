import { readFileSync } from "fs"
import { join } from "path"
import type { ILatexTemplateFiller } from "../../core/application/ports/latex-compiler"

type Contact = Record<string, unknown>
type Education = Array<Record<string, unknown>>
type Experience = Array<Record<string, unknown>>
type Projects = Array<Record<string, unknown>>
type Skills = Record<string, string[]>

type TailoredData = {
  experience: Array<{ company: string; role: string; bullets: string[] }>
  projects: Array<{ title: string; techStack: string[]; bullets: string[] }>
  skills: { languages: string[]; frameworks: string[]; tools: string[] }
}

function esc(s: string): string {
  return s.replace(/\$/g, "\\$").replace(/_/g, "\\_").replace(/&/g, "\\&").replace(/#/g, "\\#")
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
  fill(
    contact: Contact,
    education: Education,
    experience: Experience,
    projects: Projects,
    skills: Skills,
    tailored: unknown
  ): string {
    const data = tailored as TailoredData
    let tex = readFileSync(join(process.cwd(), "docs", "resume_template.tex"), "utf-8")

    const name = typeof contact.name === "string" ? contact.name : ""
    const phone = typeof contact.phone === "string" ? contact.phone : ""
    const email = typeof contact.email === "string" ? contact.email : ""
    const linkedin = typeof contact.linkedin === "string" ? contact.linkedin : ""
    const leetcode = typeof contact.leetcode === "string" ? contact.leetcode : ""
    const github = typeof contact.github === "string" ? contact.github : ""

    tex = tex.replace(/\{\{FULL_NAME\}\}/g, esc(name))
    tex = tex.replace(/\{\{PHONE\}\}/g, esc(phone))
    tex = tex.replace(/\{\{EMAIL\}\}/g, esc(email))
    tex = tex.replace(/\{\{EMAIL_DISPLAY\}\}/g, esc(email))
    tex = tex.replace(/\{\{LINKEDIN_URL\}\}/g, linkedin)
    tex = tex.replace(/\{\{LEETCODE_URL\}\}/g, leetcode || "https://leetcode.com")
    tex = tex.replace(/\{\{GITHUB_URL\}\}/g, github)

    tex = tex.replace(/\\includegraphics\[height=0.5in\]\{NSUT_logo\.png\}\n/, "")

    for (let i = 1; i <= 3; i++) {
      const entry = education[i - 1]
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

    for (let i = 1; i <= 10; i++) {
      const exp: { role?: string; company?: string; startDate?: string; endDate?: string; dates?: string; techStack?: string[]; bullets?: string[]; url?: string } = data.experience[i - 1] || experience[i - 1]
      if (exp) {
        const title = `${exp.role} -- ${exp.company}`
        tex = tex.replace(new RegExp(`\\{\\{EXP_TITLE_${i}\\}\\}`, "g"), esc(title))
        const dates = exp.dates
          ? esc(String(exp.dates))
          : exp.startDate
            ? esc(`${String(exp.startDate)}${exp.endDate ? ` -- ${String(exp.endDate)}` : ""}`)
            : ""
        tex = tex.replace(new RegExp(`\\{\\{EXP_DATES_${i}\\}\\}`, "g"), dates)
        const tech = exp.techStack || []
        tex = tex.replace(
          new RegExp(`\\{\\{EXP_TECHSTACK_${i}\\}\\}`, "g"),
          esc(Array.isArray(tech) ? tech.join(", ") : "")
        )
        for (let m = 1; m <= 5; m++) {
          const bullet = exp.bullets?.[m - 1]
          tex = tex.replace(
            new RegExp(`\\{\\{EXP_BULLET_${i}_${m}\\}\\}`, "g"),
            bullet ? bulletLine(bullet) : ""
          )
        }
      } else {
        const blockPattern = new RegExp(
          `%% --- Experience Entry ${i} ---[\\s\\S]*?(?=%% --- Experience Entry ${i + 1}|\\\\end\\{itemize\\})`
        )
        tex = tex.replace(blockPattern, "")
      }
    }

    for (let i = 1; i <= 10; i++) {
      const proj: { title?: string; dates?: string; yearRange?: string; purpose?: string; techStack?: string[]; bullets?: string[]; url?: string } = data.projects[i - 1] || projects[i - 1]
      if (proj) {
        tex = tex.replace(new RegExp(`\\{\\{PROJ_NAME_${i}\\}\\}`, "g"), esc(String(proj.title ?? "")))
        const dates = proj.dates || proj.yearRange || ""
        tex = tex.replace(new RegExp(`\\{\\{PROJ_DATES_${i}\\}\\}`, "g"), esc(String(dates)))
        const purpose = proj.purpose || ""
        tex = tex.replace(new RegExp(`\\{\\{PROJ_PURPOSE_${i}\\}\\}`, "g"), esc(String(purpose)))
        const tech = proj.techStack || []
        tex = tex.replace(
          new RegExp(`\\{\\{PROJ_TECHSTACK_${i}\\}\\}`, "g"),
          esc(Array.isArray(tech) ? tech.join(", ") : "")
        )
        for (let m = 1; m <= 5; m++) {
          const bullet = proj.bullets?.[m - 1]
          tex = tex.replace(
            new RegExp(`\\{\\{PROJ_BULLET_${i}_${m}\\}\\}`, "g"),
            bullet ? bulletLine(bullet) : ""
          )
        }
        const ghUrl = proj.url || ""
        tex = tex.replace(new RegExp(`\\{\\{PROJ_GITHUB_URL_${i}\\}\\}`, "g"), ghUrl)
        tex = tex.replace(new RegExp(`\\{\\{PROJ_GITHUB_LABEL_${i}\\}\\}`, "g"), ghUrl ? "GitHub" : "")
      } else {
        const blockPattern = new RegExp(
          `%% --- Project Entry ${i} ---[\\s\\S]*?(?=%% --- Project Entry ${i + 1}|%% --- Add more project|\\\\end\\{itemize\\})`
        )
        tex = tex.replace(blockPattern, "")
      }
    }

    tex = stripSection(tex, "EXTRA-CURRICULAR ACTIVITIES \\& ACHIEVEMENTS")

    tex = tex.replace(/\{\{SKILLS_LANGUAGES\}\}/g, esc((data.skills.languages ?? skills.languages ?? []).join(", ")))
    tex = tex.replace(/\{\{SKILLS_TOOLS\}\}/g, esc((data.skills.tools ?? skills.tools ?? []).join(", ")))
    tex = tex.replace(/\{\{SKILLS_FRAMEWORKS\}\}/g, esc((data.skills.frameworks ?? skills.frameworks ?? []).join(", ")))
    tex = tex.replace(/\{\{SKILLS_BACKEND\}\}/g, esc(""))
    tex = tex.replace(/\{\{SKILLS_COURSEWORK\}\}/g, esc(""))

    return tex
  }
}
