import { AppLayout } from '@/components/layout/app-layout'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HistoryLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session) redirect('/')
  
  const hasProfile = await auth.api.hasProfile({ headers: reqHeaders })
  if (!hasProfile) redirect('/onboarding')
  return <AppLayout user={session.user}>{children}</AppLayout>
}
