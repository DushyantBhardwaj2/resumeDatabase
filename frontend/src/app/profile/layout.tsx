import { AppLayout } from '@/components/layout/app-layout'
import { getServerSession } from '@/config/api-client-server'
import { redirect } from 'next/navigation'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/')
  return (
    <AppLayout user={session.user}>
      {children}
    </AppLayout>
  )
}
