'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useProfileStore } from '@/store/useProfileStore'
import { Sparkle, CheckSquare, Square, Plus, MagicWand } from '@phosphor-icons/react'

export function ProjectSelectionWidget({ content, onNext }: { content?: string, onNext?: () => void }) {
  const profile = useBuilderStore((s) => s.profile)
  const updateProfile = useBuilderStore((s) => s.updateProfile)
  const selectedProjectIds = useBuilderStore((s) => s.selectedProjectIds)
  const toggleProject = useBuilderStore((s) => s.toggleProject)
  
  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const toggleBullet = useBuilderStore((s) => s.toggleBullet)
  const setSelections = useBuilderStore((s) => s.setSelections)

  if (!profile || !profile.projects?.length) {
    return (
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => onNext?.()}
          className="px-4 py-2 bg-brand/10 text-brand hover:bg-brand/20 transition-colors rounded-md text-sm font-medium"
        >
          Skip Projects & Next
        </button>
      </div>
    )
  }

  const handleNext = () => {
    if (onNext) onNext()
  }

  const addCustomBullet = (projId: string, text: string) => {
    if (!text.trim()) return
    const newBullet = { id: crypto.randomUUID(), text, keywords: [], isAIGenerated: false }
    
    const newProj = profile.projects.map(p => {
      if (p.id === projId) {
        return { ...p, vaultBullets: [...p.vaultBullets, newBullet] }
      }
      return p
    })
    updateProfile({ ...profile, projects: newProj })
    
    const updatedProj = useBuilderStore.getState().profile?.projects?.find(p => p.id === projId)
    if (updatedProj) {
      useProfileStore.getState().updateProject(projId, updatedProj)
    }
    
    const currentList = selectedBulletIds[projId] || []
    setSelections({ ...selectedBulletIds, [projId]: [...currentList, newBullet.id] })
  }

  const handleSaveProjectLink = (projId: string, url: string) => {
    if (!profile) return
    const newProj = profile.projects.map(p => {
      if (p.id === projId) {
        return { ...p, url: url.trim() || null }
      }
      return p
    })
    updateProfile({ ...profile, projects: newProj })
    
    const updatedProj = newProj.find(p => p.id === projId)
    if (updatedProj) {
      useProfileStore.getState().updateProject(projId, updatedProj)
    }
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
        <h4 className="text-sm font-semibold text-fg mb-4">Projects</h4>
        
        <div className="space-y-4">
          {profile.projects.map((proj) => (
            <ProjectGroup
              key={proj.id}
              proj={proj}
              isSelected={selectedProjectIds.includes(proj.id)}
              onToggleProj={() => toggleProject(proj.id)}
              selectedBulletIds={selectedBulletIds[proj.id] || []}
              onToggleBullet={toggleBullet}
              onAddCustomBullet={addCustomBullet}
              onSaveProjectLink={handleSaveProjectLink}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleNext}
            className="px-4 py-2 bg-brand/10 text-brand hover:bg-brand/20 transition-colors rounded-md text-sm font-medium"
          >
            Confirm Projects & Next
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectGroup({ proj, isSelected, onToggleProj, selectedBulletIds, onToggleBullet, onAddCustomBullet, onSaveProjectLink }: any) {
  const [isAdding, setIsAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [isEditingLink, setIsEditingLink] = useState(false)
  const [linkInput, setLinkInput] = useState(proj.url || '')

  const handleAdd = () => {
    onAddCustomBullet(proj.id, newText)
    setIsAdding(false)
    setNewText('')
  }

  const handleSaveLink = () => {
    onSaveProjectLink(proj.id, linkInput)
    setIsEditingLink(false)
  }

  return (
    <div className={`border rounded-[var(--radius-md)] overflow-hidden transition-colors ${isSelected ? 'border-brand/50 bg-card' : 'border-edge bg-surface opacity-75'}`}>
      <div className="px-3 py-2 border-b flex items-center justify-between cursor-pointer" onClick={onToggleProj} style={{ borderColor: isSelected ? 'rgba(var(--brand), 0.2)' : 'var(--edge)' }}>
        <div className="flex items-center gap-2">
           {isSelected ? (
             <CheckSquare size={16} className="text-brand shrink-0" weight="fill" />
           ) : (
             <Square size={16} className="text-content-subtle shrink-0" />
           )}
           <p className="text-sm font-medium text-content truncate">{proj.title}</p>
        </div>
        {isSelected && <span className="text-[10px] text-brand shrink-0 ml-2">{selectedBulletIds.length}/{proj.vaultBullets.length} points</span>}
      </div>
      
      {isSelected && (
        <div className="divide-y divide-edge bg-background/50">
          {/* Link Editor / Elicitor Block */}
          <div className="px-3 py-2.5 bg-surface-subtle/50">
            {isEditingLink ? (
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Paste GitHub or deployment URL (e.g. https://...)"
                  className="flex-1 bg-background border border-edge rounded px-2 py-1 text-xs text-content outline-none focus:border-brand/50"
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveLink() }}
                  autoFocus
                />
                <button onClick={handleSaveLink} className="text-[10px] bg-brand text-brand-fg px-2 py-1 rounded font-medium shrink-0">Save</button>
                <button onClick={() => setIsEditingLink(false)} className="text-[10px] text-content-muted px-1 shrink-0">Cancel</button>
              </div>
            ) : !proj.url ? (
              <div className="text-[11px] bg-brand/5 border border-brand/10 text-brand px-3 py-1.5 rounded-md flex items-center justify-between">
                <span className="font-medium">⚠️ No live link or deployment URL added.</span>
                <button 
                  onClick={() => setIsEditingLink(true)}
                  className="text-[11px] font-semibold underline text-brand hover:text-brand-dark ml-2 shrink-0"
                >
                  Add Link
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-content-muted flex items-center justify-between bg-surface-subtle border border-edge/60 px-3 py-1 rounded-md">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-[9px] uppercase tracking-wider text-content-subtle shrink-0">Link:</span>
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-medium truncate">
                    {proj.url}
                  </a>
                </div>
                <button
                  onClick={() => {
                    setLinkInput(proj.url || '')
                    setIsEditingLink(true)
                  }}
                  className="text-[11px] font-semibold underline text-brand hover:text-brand-dark shrink-0 ml-2"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {proj.vaultBullets.map((bullet: any) => {
            const isSelectedBullet = selectedBulletIds.includes(bullet.id)
            return (
              <button
                key={bullet.id}
                onClick={() => onToggleBullet(proj.id, bullet.id)}
                className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-surface-subtle transition-colors relative group"
              >
                {isSelectedBullet ? (
                  <CheckSquare size={14} className="text-brand shrink-0 mt-0.5" weight="fill" />
                ) : (
                  <Square size={14} className="text-content-subtle shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className={`text-xs leading-relaxed ${isSelectedBullet ? 'text-content' : 'text-content-muted'}`}>
                    {bullet.text}
                  </span>
                  {bullet.isAIGenerated && (
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-brand/80 font-medium">
                      <MagicWand size={10} /> AI Tailored
                    </div>
                  )}
                </div>
              </button>
            )
          })}
          
          <div className="px-3 py-2">
            {isAdding ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Type custom point here..." 
                  className="flex-1 bg-background border border-edge rounded px-2 py-1 text-xs text-content outline-none focus:border-brand/50"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                />
                <button onClick={handleAdd} className="text-[10px] bg-brand text-brand-fg px-2 rounded font-medium">Add</button>
                <button onClick={() => setIsAdding(false)} className="text-[10px] text-content-muted px-1">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors w-full p-1">
                <Plus size={12} /> Add custom bullet point
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
