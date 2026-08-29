'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, SignOutButton } from '@clerk/nextjs'
import {
  BarChart3,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  Route as RouteIcon,
  Server,
  Settings,
  Command as CommandIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTenant } from '@/lib/contexts/tenant-context'
import { CommandMenuProvider, useCommandMenu } from '@/components/command-menu'
import { TooltipProvider } from '@/components/ui/tooltip'

const NAV = [
  { name: 'Board', href: '/dashboard', icon: LayoutGrid },
  { name: 'Origins', href: '/dashboard/services', icon: Server },
  { name: 'Routes', href: '/dashboard/routes', icon: RouteIcon },
  { name: 'Keys', href: '/dashboard/api-keys', icon: KeyRound },
  { name: 'Traffic', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Exchange', href: '/dashboard/settings', icon: Settings },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <CommandMenuProvider>
        <ShellInner>{children}</ShellInner>
      </CommandMenuProvider>
    </TooltipProvider>
  )
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { tenant } = useTenant()
  const { open } = useCommandMenu()
  const [railOpen, setRailOpen] = useState(false)

  const section = NAV.find((n) =>
    n.href === '/dashboard' ? pathname === n.href : pathname.startsWith(n.href),
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* left rail */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-52 flex-col border-r border-border bg-card transition-transform lg:translate-x-0',
          railOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <span className="h-2 w-2 rounded-full bg-patch" />
          <span className="font-display text-sm font-semibold tracking-tight">VantageEdge</span>
        </div>

        <nav className="flex-1 py-3">
          {NAV.map((item, i) => {
            const active =
              item.href === '/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setRailOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-patch transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center gap-2.5">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'h-7 w-7 rounded-[3px]' } }} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-xs text-foreground">{tenant?.name ?? '—'}</div>
              <div className="ledger truncate text-[11px] text-muted-foreground">
                {tenant ? `${tenant.subdomain}.vantageedge.dev` : 'resolving…'}
              </div>
            </div>
          </div>
          <SignOutButton redirectUrl="/">
            <button className="flex w-full items-center gap-2 rounded px-1 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {railOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 lg:hidden"
          onClick={() => setRailOpen(false)}
        />
      )}

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-52">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
          <button
            className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setRailOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="ledger flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">the&nbsp;exchange</span>
            <span className="hidden text-border sm:inline">/</span>
            <span className="text-foreground">{section?.name.toLowerCase() ?? 'board'}</span>
          </div>

          <div className="flex-1" />

          <button
            onClick={open}
            className="flex items-center gap-2 rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <CommandIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">patch bay</span>
            <kbd className="ledger rounded-[2px] border border-border px-1 text-[10px]">⌘K</kbd>
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
