'use client'

import { Folder, Briefcase, GraduationCap, Wrench, Certificate, Trophy } from '@phosphor-icons/react'

interface SearchResultsWidgetProps {
  results: any[]
}

export function SearchResultsWidget({ results }: SearchResultsWidgetProps) {
  if (!results || results.length === 0) return null

  const renderIcon = (type: string) => {
    const classes = 'w-4 h-4 text-brand shrink-0'
    if (type === 'experience') return <Briefcase className={classes} />
    if (type === 'project') return <Folder className={classes} />
    if (type === 'education') return <GraduationCap className={classes} />
    if (type === 'skill') return <Wrench className={classes} />
    if (type === 'certificate') return <Certificate className={classes} />
    return <Trophy className={classes} />
  }

  return (
    <div className="space-y-2.5 my-3 w-full max-w-md">
      {results.map((item) => (
        <div
          key={item.id}
          className="p-3.5 bg-surface/50 border border-edge rounded-xl hover:border-brand/40 transition-all flex items-start gap-3 group shadow-sm hover:shadow-md"
        >
          {renderIcon(item.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs text-fg truncate leading-none">
                {item.title}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-content-muted leading-none">
                {item.type}
              </span>
            </div>
            {item.bulletSummary && (
              <p className="text-[11px] text-content-muted mt-1 leading-relaxed line-clamp-2">
                {item.bulletSummary}
              </p>
            )}
            {item.keywords && item.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.keywords.slice(0, 4).map((keyword: string) => (
                  <span
                    key={keyword}
                    className="text-[9px] bg-background border border-edge/40 px-1.5 py-0.5 rounded text-content-muted font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
