'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Copy,
  KeyRound,
  LayoutGrid,
  Plus,
  Route as RouteIcon,
  Server,
  Settings,
} from 'lucide-react'
import { originsApi, routesApi } from '@/lib/api/resources'
import { qk } from '@/lib/hooks/use-resource'
import { useTenant } from '@/lib/contexts/tenant-context'
import { copyText } from '@/lib/utils'
import { toast } from 'sonner'

type Action = () => void

interface CommandMenuContextValue {
  open: () => void
  register: (id: string, actions: Record<string, Action>) => () => void
}

const Ctx = createContext<CommandMenuContextValue | null>(null)

/** Lets a page contribute page-specific actions (e.g. "New route"). */
export function useCommandMenu() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCommandMenu must be used within CommandMenuProvider')
  return ctx
}

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [registry, setRegistry] = useState<Record<string, Record<string, Action>>>({})
  const { tenant } = useTenant()

  const register = useCallback((id: string, actions: Record<string, Action>) => {
    setRegistry((r) => ({ ...r, [id]: actions }))
    return () => setRegistry((r) => {
      const next = { ...r }
      delete next[id]
      return next
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const { data: routes = [] } = useQuery({ queryKey: qk.routes, queryFn: routesApi.list, enabled: isOpen })
  const { data: origins = [] } = useQuery({ queryKey: qk.origins, queryFn: originsApi.list, enabled: isOpen })

  const go = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  const pageActions = useMemo(() => Object.values(registry).flatMap((a) => Object.entries(a)), [registry])

  const value = useMemo(() => ({ open: () => setIsOpen(true), register }), [register])

  return (
    <Ctx.Provider value={value}>
      {children}
      <Command.Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        label="Patch bay"
        overlayClassName="fixed inset-0 z-[99] bg-background/70 data-[state=open]:animate-fade-in"
        contentClassName="fixed left-1/2 top-[20vh] z-[100] w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded border border-border bg-popover shadow-2xl data-[state=open]:animate-fade-in"
      >
        <div className="eyebrow after:hidden border-b border-border px-4 py-2">patch bay</div>
        <Command.Input
          placeholder="Patch to a route, origin, or panel…"
          className="ledger w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-80 overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing matches.
          </Command.Empty>

          <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground">
            <Item icon={LayoutGrid} onSelect={() => go('/dashboard')}>Overview</Item>
            <Item icon={Server} onSelect={() => go('/dashboard/services')}>Origins</Item>
            <Item icon={RouteIcon} onSelect={() => go('/dashboard/routes')}>Routes</Item>
            <Item icon={KeyRound} onSelect={() => go('/dashboard/api-keys')}>API keys</Item>
            <Item icon={BarChart3} onSelect={() => go('/dashboard/analytics')}>Analytics</Item>
            <Item icon={Settings} onSelect={() => go('/dashboard/settings')}>Settings</Item>
          </Command.Group>

          {pageActions.length > 0 && (
            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground">
              {pageActions.map(([label, run]) => (
                <Item key={label} icon={Plus} onSelect={() => { run(); setIsOpen(false) }}>
                  {label}
                </Item>
              ))}
              {tenant && (
                <Item
                  icon={Copy}
                  onSelect={async () => {
                    setIsOpen(false)
                    if (await copyText(tenant.id)) toast.success('Tenant ID copied')
                  }}
                >
                  Copy tenant ID
                </Item>
              )}
            </Command.Group>
          )}

          {routes.length > 0 && (
            <Command.Group heading="Routes" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground">
              {routes.map((r) => (
                <Item key={r.id} icon={RouteIcon} onSelect={() => go(`/dashboard/routes?id=${r.id}`)}>
                  <span>{r.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{r.path_pattern}</span>
                </Item>
              ))}
            </Command.Group>
          )}

          {origins.length > 0 && (
            <Command.Group heading="Origins" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground">
              {origins.map((o) => (
                <Item key={o.id} icon={Server} onSelect={() => go(`/dashboard/services?id=${o.id}`)}>
                  <span>{o.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{o.url}</span>
                </Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command.Dialog>
    </Ctx.Provider>
  )
}

function Item({
  icon: Icon,
  children,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      {children}
    </Command.Item>
  )
}
