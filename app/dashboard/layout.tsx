import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/shell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!auth().userId) redirect('/auth/sign-in')
  return <DashboardShell>{children}</DashboardShell>
}
