import { useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function useIsActive(): (href: string) => boolean {
  const pathname = usePathname()

  return useCallback(
    (href: string): boolean => {
      if (href === '/dashboard' && pathname === '/dashboard') return true
      if (href !== '/dashboard' && pathname.startsWith(href)) return true
      return false
    },
    [pathname],
  )
}
