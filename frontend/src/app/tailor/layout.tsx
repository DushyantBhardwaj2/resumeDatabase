import { AppLayout } from '@/components/layout/app-layout'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function TailorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/')
  return <AppLayout user={session.user}>{children}</AppLayout>
}
