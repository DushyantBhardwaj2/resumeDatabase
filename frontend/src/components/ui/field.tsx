"use client"

import { forwardRef } from "react"

interface FieldProps {
  label: string
  value: string | number | readonly string[] | null | undefined
  onChange: (value: string) => void
  layout?: "vertical" | "horizontal"
  labelWidth?: string
  placeholder?: string
  type?: string
  className?: string
  id?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, value, onChange, layout = "vertical", labelWidth, placeholder, type = "text", className = "", id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-")
    const inputClass =
      "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"

    const input = (
      <input
        ref={ref}
        id={inputId}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} ${className}`}
        {...props}
      />
    )

    if (layout === "horizontal") {
      return (
        <div className="flex items-center gap-3">
          <label htmlFor={inputId} className={`text-sm font-medium text-muted-foreground ${labelWidth ? "" : "w-24"}`} style={labelWidth ? { width: labelWidth } : undefined}>
            {label}
          </label>
          {input}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        {input}
      </div>
    )
  }
)

Field.displayName = "Field"
