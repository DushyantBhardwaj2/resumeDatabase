interface SectionCardProps {
  title: string
  spacing?: "sm" | "md"
  children: React.ReactNode
}

export function SectionCard({ title, spacing = "md", children }: SectionCardProps) {
  return (
    <div className={spacing === "sm" ? "space-y-3" : "space-y-4"}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}
