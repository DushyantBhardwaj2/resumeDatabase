'use client'

import { useState } from 'react'
import { api } from '@/config/api-client'
import { Check, Pencil, Trash, X, Plus, Folder, Briefcase, GraduationCap, Wrench, Certificate, Trophy } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ProposalCardsWidgetProps {
  actions: any[]
}

export function ProposalCardsWidget({ actions: initialActions }: ProposalCardsWidgetProps) {
  const [actions, setActions] = useState(
    initialActions.map((action, index) => ({
      id: index,
      original: action,
      current: JSON.parse(JSON.stringify(action)), // deep copy
      status: 'pending' as 'pending' | 'saved' | 'rejected',
      isEditing: false,
    }))
  )

  const handleSave = async (id: number) => {
    const actObj = actions.find((a) => a.id === id)
    if (!actObj) return

    try {
      const res = await api.api.protected.memory.apply.$post({
        json: { actions: [actObj.current] },
      })

      if (res.ok) {
        setActions((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'saved', isEditing: false } : a))
        )
        toast.success('Saved to Career Memory!')
      } else {
        throw new Error('Failed to save')
      }
    } catch {
      toast.error('Failed to save memory entry')
    }
  }

  const handleReject = (id: number) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected', isEditing: false } : a))
    )
    toast.info('Proposal rejected')
  }

  const updateField = (id: number, path: string[], value: any) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const updated = JSON.parse(JSON.stringify(a.current))
        // Traverses the path and updates the value
        let current = updated
        for (let i = 0; i < path.length - 1; i++) {
          const part = path[i]
          if (!current[part]) current[part] = {}
          current = current[part]
        }
        current[path[path.length - 1]] = value
        return { ...a, current: updated }
      })
    )
  }

  const handleAddBullet = (id: number, typeKey: string) => {
    const actObj = actions.find((a) => a.id === id)
    if (!actObj) return
    const bullets = actObj.current[typeKey].bullets || []
    updateField(id, [typeKey, 'bullets'], [...bullets, { text: '', order: bullets.length }])
  }

  const handleRemoveBullet = (id: number, typeKey: string, bulletIndex: number) => {
    const actObj = actions.find((a) => a.id === id)
    if (!actObj) return
    const bullets = actObj.current[typeKey].bullets || []
    const filtered = bullets.filter((_: any, idx: number) => idx !== bulletIndex)
    updateField(id, [typeKey, 'bullets'], filtered)
  }

  const renderIcon = (type: string) => {
    const classes = 'w-5 h-5 text-brand'
    if (type.includes('EXPERIENCE')) return <Briefcase className={classes} weight="fill" />
    if (type.includes('PROJECT')) return <Folder className={classes} weight="fill" />
    if (type.includes('EDUCATION')) return <GraduationCap className={classes} weight="fill" />
    if (type.includes('SKILL')) return <Wrench className={classes} weight="fill" />
    if (type.includes('CERTIFICATE')) return <Certificate className={classes} weight="fill" />
    return <Trophy className={classes} weight="fill" />
  }

  const renderBadge = (type: string) => {
    let label = 'Entry'
    if (type.includes('EXPERIENCE')) label = 'Experience'
    if (type.includes('PROJECT')) label = 'Project'
    if (type.includes('EDUCATION')) label = 'Education'
    if (type.includes('SKILL')) label = 'Skill'
    if (type.includes('CERTIFICATE')) label = 'Certificate'
    if (type.includes('ACHIEVEMENT')) label = 'Achievement'

    return (
      <span className="text-[10px] uppercase font-bold tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">
        {label}
      </span>
    )
  }

  return (
    <div className="space-y-4 my-3 w-full">
      {actions.map((act) => {
        if (act.status === 'rejected') return null
        if (act.status === 'saved') {
          return (
            <div
              key={act.id}
              className="p-3 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-between text-xs text-brand font-medium animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <Check size={16} weight="bold" />
                <span>Saved successfully!</span>
              </div>
            </div>
          )
        }

        const type = act.current.type
        const isEditing = act.isEditing

        // Determine entity key based on type
        let entityKey = 'experience'
        if (type === 'CREATE_PROJECT') entityKey = 'project'
        if (type === 'CREATE_EDUCATION') entityKey = 'education'
        if (type === 'CREATE_SKILL') entityKey = 'skill'
        if (type === 'CREATE_CERTIFICATE') entityKey = 'certificate'
        if (type === 'CREATE_ACHIEVEMENT') entityKey = 'achievement'

        const entity = act.current[entityKey] || {}

        return (
          <div
            key={act.id}
            className="glass border border-edge/60 bg-card/60 backdrop-blur rounded-2xl p-5 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col gap-4"
          >
            {/* Top row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {renderIcon(type)}
                {renderBadge(type)}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setActions((prev) =>
                        prev.map((a) => (a.id === act.id ? { ...a, isEditing: true } : a))
                      )
                    }
                    className="p-1.5 hover:bg-surface-subtle rounded-lg text-content-muted hover:text-content transition-colors cursor-pointer"
                    title="Edit entry"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleReject(act.id)}
                    className="p-1.5 hover:bg-error/15 rounded-lg text-content-muted hover:text-error transition-colors cursor-pointer"
                    title="Reject entry"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Editing mode */}
            {isEditing ? (
              <div className="space-y-3 text-xs">
                {type === 'CREATE_EXPERIENCE' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">Company</label>
                        <input
                          type="text"
                          value={entity.company || ''}
                          onChange={(e) => updateField(act.id, ['experience', 'company'], e.target.value)}
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">Role</label>
                        <input
                          type="text"
                          value={entity.role || ''}
                          onChange={(e) => updateField(act.id, ['experience', 'role'], e.target.value)}
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">Start Date</label>
                        <input
                          type="text"
                          value={entity.startDate || ''}
                          onChange={(e) => updateField(act.id, ['experience', 'startDate'], e.target.value)}
                          placeholder="e.g. June 2024"
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">End Date</label>
                        <input
                          type="text"
                          value={entity.endDate || ''}
                          disabled={entity.current}
                          onChange={(e) => updateField(act.id, ['experience', 'endDate'], e.target.value)}
                          placeholder="e.g. Present"
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`current-${act.id}`}
                        checked={!!entity.current}
                        onChange={(e) => {
                          updateField(act.id, ['experience', 'current'], e.target.checked)
                          if (e.target.checked) updateField(act.id, ['experience', 'endDate'], '')
                        }}
                        className="rounded accent-brand"
                      />
                      <label htmlFor={`current-${act.id}`} className="text-[11px] text-content font-medium">Currently work here</label>
                    </div>
                  </>
                )}

                {type === 'CREATE_PROJECT' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">Project Title</label>
                        <input
                          type="text"
                          value={entity.title || ''}
                          onChange={(e) => updateField(act.id, ['project', 'title'], e.target.value)}
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">Project URL</label>
                        <input
                          type="text"
                          value={entity.url || ''}
                          onChange={(e) => updateField(act.id, ['project', 'url'], e.target.value)}
                          placeholder="e.g. https://github.com/..."
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-content-muted block mb-1">Tech Stack (comma separated)</label>
                      <input
                        type="text"
                        value={(entity.techStack || []).join(', ')}
                        onChange={(e) =>
                          updateField(
                            act.id,
                            ['project', 'techStack'],
                            e.target.value.split(',').map((x) => x.trim()).filter(Boolean)
                          )
                        }
                        className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                      />
                    </div>
                  </>
                )}

                {type === 'CREATE_EDUCATION' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">School</label>
                        <input
                          type="text"
                          value={entity.school || ''}
                          onChange={(e) => updateField(act.id, ['education', 'school'], e.target.value)}
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">Degree</label>
                        <input
                          type="text"
                          value={entity.degree || ''}
                          onChange={(e) => updateField(act.id, ['education', 'degree'], e.target.value)}
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-content-muted block mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={entity.field || ''}
                          onChange={(e) => updateField(act.id, ['education', 'field'], e.target.value)}
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-content-muted block mb-1">GPA</label>
                        <input
                          type="text"
                          value={entity.gpa || ''}
                          onChange={(e) => updateField(act.id, ['education', 'gpa'], e.target.value)}
                          className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {type === 'CREATE_SKILL' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-content-muted block mb-1">Name</label>
                      <input
                        type="text"
                        value={entity.name || ''}
                        onChange={(e) => updateField(act.id, ['skill', 'name'], e.target.value)}
                        className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-content-muted block mb-1">Category</label>
                      <select
                        value={entity.category || 'TOOL'}
                        onChange={(e) => updateField(act.id, ['skill', 'category'], e.target.value)}
                        className="w-full bg-background border border-edge rounded px-2.5 py-1.5 text-xs text-content outline-none focus:border-brand/50"
                      >
                        <option value="LANGUAGE">Language</option>
                        <option value="FRAMEWORK">Framework</option>
                        <option value="TOOL">Tool</option>
                        <option value="PLATFORM">Platform</option>
                        <option value="CONCEPT">Concept</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Bullets sub-editor for experience & project */}
                {(type === 'CREATE_EXPERIENCE' || type === 'CREATE_PROJECT') && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between border-t border-edge/40 pt-2">
                      <span className="text-[10px] font-bold text-content uppercase tracking-wide">Bullet Points</span>
                      <button
                        onClick={() => handleAddBullet(act.id, entityKey)}
                        className="flex items-center gap-1 text-[10px] text-brand font-medium hover:underline cursor-pointer"
                      >
                        <Plus size={12} /> Add Point
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(entity.bullets || []).map((bullet: any, idx: number) => (
                        <div key={idx} className="flex gap-1.5 items-start">
                          <textarea
                            value={bullet.text || ''}
                            onChange={(e) => {
                              const updatedBullets = [...entity.bullets]
                              updatedBullets[idx].text = e.target.value
                              updateField(act.id, [entityKey, 'bullets'], updatedBullets)
                            }}
                            rows={1}
                            className="flex-1 bg-background border border-edge rounded px-2 py-1 text-xs text-content outline-none resize-none focus:border-brand/50 min-h-[30px]"
                          />
                          <button
                            onClick={() => handleRemoveBullet(act.id, entityKey, idx)}
                            className="p-1 hover:bg-error/15 rounded text-content-muted hover:text-error transition-colors mt-0.5 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2 border-t border-edge/40">
                  <button
                    onClick={() =>
                      setActions((prev) =>
                        prev.map((a) => (a.id === act.id ? { ...a, isEditing: false } : a))
                      )
                    }
                    className="px-3 py-1.5 bg-surface-subtle hover:bg-surface-subtle/85 text-content rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(act.id)}
                    className="px-3 py-1.5 bg-brand text-brand-fg hover:bg-brand/90 rounded-lg font-medium cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-3">
                {type === 'CREATE_EXPERIENCE' && (
                  <div>
                    <h4 className="text-sm font-semibold text-fg">
                      {entity.role} at {entity.company}
                    </h4>
                    <p className="text-[11px] text-content-muted mt-0.5 font-medium">
                      {entity.startDate} – {entity.endDate || (entity.current ? 'Present' : '')}
                    </p>
                    <ul className="list-disc list-outside pl-4 mt-2 space-y-1">
                      {(entity.bullets || []).map((bullet: any, idx: number) => (
                        <li key={idx} className="text-xs text-content leading-relaxed">
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {type === 'CREATE_PROJECT' && (
                  <div>
                    <h4 className="text-sm font-semibold text-fg">
                      {entity.title}
                      {entity.url && (
                        <a
                          href={entity.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-brand ml-2 font-medium hover:underline"
                        >
                          View Link
                        </a>
                      )}
                    </h4>
                    {entity.techStack && entity.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {entity.techStack.map((tech: string) => (
                          <span key={tech} className="text-[10px] bg-surface-subtle px-2 py-0.5 rounded text-content font-medium border border-edge/30">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    <ul className="list-disc list-outside pl-4 mt-2 space-y-1">
                      {(entity.bullets || []).map((bullet: any, idx: number) => (
                        <li key={idx} className="text-xs text-content leading-relaxed">
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {type === 'CREATE_EDUCATION' && (
                  <div>
                    <h4 className="text-sm font-semibold text-fg">
                      {entity.degree} at {entity.school}
                    </h4>
                    <p className="text-xs text-content mt-1">
                      {entity.field && <span className="font-medium">Field: {entity.field}</span>}
                      {entity.gpa && <span className="ml-3 text-content-muted">GPA: {entity.gpa}</span>}
                    </p>
                  </div>
                )}

                {type === 'CREATE_SKILL' && (
                  <div>
                    <h4 className="text-sm font-semibold text-fg">{entity.name}</h4>
                    <p className="text-[11px] text-content-muted mt-1 uppercase font-bold tracking-wider">
                      Category: {entity.category}
                    </p>
                  </div>
                )}

                {type === 'CREATE_CERTIFICATE' && (
                  <div>
                    <h4 className="text-sm font-semibold text-fg">{entity.name}</h4>
                    <p className="text-xs text-content-muted mt-0.5">Issued by {entity.issuer}</p>
                    {entity.url && (
                      <a
                        href={entity.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand mt-1 inline-block font-medium hover:underline"
                      >
                        Verification Page
                      </a>
                    )}
                  </div>
                )}

                {type === 'CREATE_ACHIEVEMENT' && (
                  <div>
                    <h4 className="text-sm font-semibold text-fg">{entity.title}</h4>
                    <p className="text-xs text-content leading-relaxed mt-1">{entity.description}</p>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3 border-t border-edge/40 mt-1">
                  <button
                    onClick={() => handleReject(act.id)}
                    className="px-3.5 py-1.5 hover:bg-error/10 text-content-muted hover:text-error rounded-lg font-medium text-xs transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleSave(act.id)}
                    className="px-4 py-1.5 bg-brand text-brand-fg hover:bg-brand/95 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-brand/10 transition-colors cursor-pointer"
                  >
                    <Check size={14} weight="bold" /> Confirm & Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
