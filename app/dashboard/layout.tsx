import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect('/auth/sign-in')
  }

  // Don't block rendering - let client-side sync handle it
  // This allows users to see the dashboard UI while syncing happens
  return <DashboardShell>{children}</DashboardShell>
}
