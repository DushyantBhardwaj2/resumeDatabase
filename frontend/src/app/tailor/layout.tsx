import { AppLayout } from '@/components/layout/app-layout'
import { getServerSession, hasProfile } from '@/config/api-client-server'
import { redirect } from 'next/navigation'

export default async function TailorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/')
  
  const hasProf = await hasProfile()
  if (!hasProf) redirect('/onboarding')
  return <AppLayout user={session.user}>{children}</AppLayout>
}
