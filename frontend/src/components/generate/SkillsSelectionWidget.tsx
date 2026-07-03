'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { Sparkle, Plus, X } from '@phosphor-icons/react'

export function SkillsSelectionWidget({ content }: { content?: string }) {
  const profile = useBuilderStore((s) => s.profile)
  const setProfile = useBuilderStore((s) => s.setProfile)

  if (!profile || !profile.skills) return null

  const removeSkill = (category: 'languages' | 'frameworks' | 'tools', skill: string) => {
    const current = profile.skills[category] || []
    setProfile({
      ...profile,
      skills: {
        ...profile.skills,
        [category]: current.filter(s => s !== skill)
      }
    })
  }

  const addSkill = (category: 'languages' | 'frameworks' | 'tools', skill: string) => {
    if (!skill.trim()) return
    const current = profile.skills[category] || []
    if (current.includes(skill.trim())) return
    setProfile({
      ...profile,
      skills: {
        ...profile.skills,
        [category]: [...current, skill.trim()]
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Sparkle size={16} className="text-brand" />
        </div>
        <div className="pt-1.5">
          <p className="text-sm text-content leading-relaxed">{content}</p>
        </div>
      </div>
      
      <div className="ml-11 bg-surface/50 border border-edge rounded-xl p-5 shadow-sm backdrop-blur-md">
        <h4 className="text-sm font-semibold text-fg mb-4">Skills</h4>
        
        <div className="space-y-6">
          <SkillCategory 
            title="Languages" 
            items={profile.skills.languages || []} 
            onRemove={(s) => removeSkill('languages', s)} 
            onAdd={(s) => addSkill('languages', s)} 
          />
          <SkillCategory 
            title="Frameworks/Libraries" 
            items={profile.skills.frameworks || []} 
            onRemove={(s) => removeSkill('frameworks', s)} 
            onAdd={(s) => addSkill('frameworks', s)} 
          />
          <SkillCategory 
            title="Tools/Platforms" 
            items={profile.skills.tools || []} 
            onRemove={(s) => removeSkill('tools', s)} 
            onAdd={(s) => addSkill('tools', s)} 
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            className="px-4 py-2 bg-brand text-brand-fg transition-colors rounded-md text-sm font-medium shadow-md shadow-brand/20"
            onClick={() => {
              // The PDF Preview automatically compiles on changes, so we just acknowledge completion
            }}
          >
            Review PDF Preview
          </button>
        </div>
      </div>
    </div>
  )
}

function SkillCategory({ title, items, onRemove, onAdd }: { title: string, items: string[], onRemove: (s:string)=>void, onAdd: (s:string)=>void }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newText, setNewText] = useState('')

  const handleAdd = () => {
    onAdd(newText)
    setIsAdding(false)
    setNewText('')
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-brand uppercase mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(skill => (
          <div key={skill} className="flex items-center gap-1 bg-surface-subtle border border-edge rounded-full px-3 py-1 text-xs text-content">
            {skill}
            <button onClick={() => onRemove(skill)} className="text-content-muted hover:text-error transition-colors">
              <X size={12} weight="bold" />
            </button>
          </div>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-1 bg-surface border border-brand/50 rounded-full px-2 py-0.5">
            <input 
              type="text" 
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="bg-transparent border-none text-xs text-content outline-none w-20 px-1"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            />
            <button onClick={handleAdd} className="text-brand hover:text-brand/80"><Plus size={12} weight="bold"/></button>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 bg-background border border-dashed border-edge rounded-full px-3 py-1 text-xs text-content-muted hover:text-content hover:border-brand/50 transition-colors">
            <Plus size={12} /> Add
          </button>
        )}
      </div>
    </div>
  )
}
