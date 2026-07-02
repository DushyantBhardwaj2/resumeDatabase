'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash } from '@phosphor-icons/react'
import type { Experience, Project, VaultBullet } from '@resumint/shared'

type EditEntryDialogProps = {
  isOpen: boolean
  onClose: () => void
  type: 'EXPERIENCE' | 'PROJECT' | null
  item: Experience | Project | null
  onSave: (item: any) => void
}

export function EditEntryDialog({ isOpen, onClose, type, item, onSave }: EditEntryDialogProps) {
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (item && isOpen) {
      setFormData(structuredClone(item))
    }
  }, [item, isOpen])

  if (!item || !type) return null

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleBulletChange = (id: string, newText: string) => {
    setFormData((prev: any) => ({
      ...prev,
      vaultBullets: prev.vaultBullets.map((b: VaultBullet) => b.id === id ? { ...b, text: newText } : b)
    }))
  }

  const handleBulletDelete = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      vaultBullets: prev.vaultBullets.filter((b: VaultBullet) => b.id !== id)
    }))
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {type === 'EXPERIENCE' ? 'Experience' : 'Project'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {type === 'EXPERIENCE' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content">Company</label>
                  <Input value={formData.company || ''} onChange={(e) => handleChange('company', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content">Role</label>
                  <Input value={formData.role || ''} onChange={(e) => handleChange('role', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content">Start Date</label>
                  <Input value={formData.startDate || ''} onChange={(e) => handleChange('startDate', e.target.value)} placeholder="e.g. Jun 2023" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content">End Date</label>
                  <Input value={formData.endDate || ''} onChange={(e) => handleChange('endDate', e.target.value)} placeholder="e.g. Present" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content">Title</label>
                <Input value={formData.title || ''} onChange={(e) => handleChange('title', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content">URL</label>
                <Input value={formData.url || ''} onChange={(e) => handleChange('url', e.target.value)} placeholder="https://github.com/..." />
              </div>
            </>
          )}

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-content">Vault Bullets</h4>
            {formData.vaultBullets?.map((bullet: VaultBullet) => (
              <div key={bullet.id} className="flex items-start gap-2">
                <Textarea
                  value={bullet.text}
                  onChange={(e) => handleBulletChange(bullet.id, e.target.value)}
                  className="min-h-[60px] text-xs leading-relaxed resize-y"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleBulletDelete(bullet.id)} 
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                  title="Delete bullet"
                >
                  <Trash size={16} />
                </Button>
              </div>
            ))}
            {formData.vaultBullets?.length === 0 && (
              <p className="text-xs text-content-muted italic">No bullets remaining.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
