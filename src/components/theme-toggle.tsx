'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  size?: number
  className?: string
}

export function ThemeToggle({ size = 16, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={[
        'rounded-[var(--radius-md)] h-8 w-8 flex items-center justify-center',
        'text-content-muted hover:text-content hover:bg-surface',
        'transition-colors cursor-pointer border-0 bg-transparent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun size={size} weight="regular" />
      ) : (
        <Moon size={size} weight="regular" />
      )}
    </button>
  )
}

export default ThemeToggle
