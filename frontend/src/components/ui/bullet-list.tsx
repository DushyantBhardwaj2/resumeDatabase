"use client"

interface BulletListProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}

export function BulletList({ items, onChange, placeholder = "Describe your accomplishment..." }: BulletListProps) {
  const add = () => onChange([...items, ""])
  const update = (i: number, val: string) => {
    const next = items.map((item, idx) => (idx === i ? val : item))
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <span className="mt-2.5 text-muted-foreground">•</span>
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder={placeholder}
          />
          <button onClick={() => remove(i)} className="mt-2 text-muted-foreground hover:text-error" type="button">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button onClick={add} type="button" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add bullet
      </button>
    </div>
  )
}
