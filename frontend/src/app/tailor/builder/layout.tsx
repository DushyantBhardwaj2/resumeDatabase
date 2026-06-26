import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resume Builder — Resumint',
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
