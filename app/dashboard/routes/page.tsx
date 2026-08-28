'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MoreHorizontal, Plus } from 'lucide-react'
import { originsApi, routesApi } from '@/lib/api/resources'
import { qk, useOptimisticMutation } from '@/lib/hooks/use-resource'
import { useListKeys } from '@/lib/hooks/use-list-keys'
import { useCommandMenu } from '@/components/command-menu'
import type { Route } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Drawer } from '@/components/drawer'
import { InlineEdit } from '@/components/inline-edit'
import { PolicyChips } from '@/components/policy-chips'
import { AddRouteDialog } from '@/components/dashboard/add-route-dialog'
import { RoutePool } from '@/components/dashboard/route-pool'
import { cn } from '@/lib/utils'

export default function RoutesPage() {
  const searchRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Route | null>(null)
  const cmd = useCommandMenu()

  const { data: routes = [], isLoading } = useQuery({ queryKey: qk.routes, queryFn: routesApi.list })
  const { data: origins = [] } = useQuery({ queryKey: qk.origins, queryFn: originsApi.list })
  const originName = useMemo(() => new Map(origins.map((o) => [o.id, o.name])), [origins])

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) setDrawerId(id)
  }, [])

  useEffect(
    () => cmd.register('routes', { 'Patch a route': () => { setEditing(null); setDialogOpen(true) } }),
    [cmd],
  )

  const patch = useOptimisticMutation<{ id: string; body: Partial<Route> }, Route, Route[]>({
    mutationFn: ({ id, body }) => routesApi.update(id, body),
    listKey: qk.routes,
    optimistic: (cur, { id, body }) => cur?.map((r) => (r.id === id ? { ...r, ...body } : r)),
  })

  const remove = useOptimisticMutation<string, void, Route[]>({
    mutationFn: (id) => routesApi.remove(id),
    listKey: qk.routes,
    optimistic: (cur, id) => cur?.filter((r) => r.id !== id),
    success: 'Route unpatched',
  })

  const filtered = routes
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.path_pattern.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.priority - a.priority)

  const { cursor } = useListKeys({
    count: filtered.length,
    searchRef,
    onEnter: (i) => filtered[i] && setDrawerId(filtered[i].id),
    onToggle: (i) => {
      const r = filtered[i]
      if (r) patch.mutate({ id: r.id, body: { is_active: !r.is_active } })
    },
  })

  const drawerRoute = routes.find((r) => r.id === drawerId) ?? null

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Routes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The patch list, highest priority first. Each line reads left to right: what comes in, how it's
            checked, where it goes.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} disabled={origins.length === 0}>
          <Plus /> Patch a route
        </Button>
      </header>

      <Input
        ref={searchRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by name or path   ( / )"
        className="max-w-sm"
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <Empty
          q={q}
          noOrigins={origins.length === 0}
          onAdd={() => { setEditing(null); setDialogOpen(true) }}
        />
      ) : (
        <ul className="panel divide-y divide-border/70">
          {filtered.map((r, i) => (
            <li
              key={r.id}
              data-active={cursor === i}
              className={cn(
                'flex flex-col gap-2 px-4 py-3 transition-colors data-[active=true]:bg-accent/40',
                !r.is_active && 'opacity-55',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => setDrawerId(r.id)}>
                  <div className="patch-line">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.methods.join(' ')}
                    </span>
                    <span className="truncate font-mono text-sm text-foreground">{r.path_pattern}</span>
                    <span className="patch-arrow">═▶</span>
                    <PolicyChips route={r} className="flex flex-wrap items-center gap-1" />
                    <span className="patch-arrow">═▶</span>
                    <span className="font-mono text-sm text-lamp">
                      {originName.get(r.origin_id) ?? 'unpatched'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.name} · priority {r.priority}
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) => patch.mutate({ id: r.id, body: { is_active: v } })}
                    aria-label="Toggle route"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDrawerId(r.id)}>Open</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditing(r); setDialogOpen(true) }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setConfirmDelete(r)}
                      >
                        Unpatch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {(r.rate_limit_enabled || r.cache_enabled) && (
                <div className="ledger flex flex-wrap gap-x-6 gap-y-1 pl-1 text-[11px] text-muted-foreground">
                  {r.rate_limit_enabled && (
                    <span>
                      rate{' '}
                      <InlineEdit
                        value={r.rate_limit_requests_per_second}
                        type="number"
                        min={1}
                        suffix="/s"
                        onCommit={(v) =>
                          patch.mutate({ id: r.id, body: { rate_limit_requests_per_second: Number(v) } })
                        }
                      />
                    </span>
                  )}
                  {r.cache_enabled && (
                    <span>
                      ttl{' '}
                      <InlineEdit
                        value={r.cache_ttl_seconds}
                        type="number"
                        min={1}
                        suffix="s"
                        onCommit={(v) => patch.mutate({ id: r.id, body: { cache_ttl_seconds: Number(v) } })}
                      />
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="ledger text-[11px] text-muted-foreground">
        j / k move · enter opens · x toggles active · / filters
      </p>

      <AddRouteDialog open={dialogOpen} onOpenChange={setDialogOpen} route={editing} />

      <Drawer
        open={!!drawerRoute}
        onOpenChange={(o) => !o && setDrawerId(null)}
        eyebrow="route"
        title={drawerRoute?.name ?? ''}
        footer={
          drawerRoute && (
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => { setEditing(drawerRoute); setDialogOpen(true); setDrawerId(null) }}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { setConfirmDelete(drawerRoute); setDrawerId(null) }}>
                Unpatch
              </Button>
            </div>
          )
        }
      >
        {drawerRoute && (
          <div className="space-y-6">
            <div className="patch-line rounded border border-border bg-background p-3">
              <span className="font-mono text-[11px] text-muted-foreground">{drawerRoute.methods.join(' ')}</span>
              <span className="font-mono text-sm text-foreground">{drawerRoute.path_pattern}</span>
            </div>

            <dl className="ledger space-y-3 text-sm">
              <Row k="Active">
                <Switch
                  checked={drawerRoute.is_active}
                  onCheckedChange={(v) => patch.mutate({ id: drawerRoute.id, body: { is_active: v } })}
                />
              </Row>
              <Row k="Priority">
                <InlineEdit
                  value={drawerRoute.priority}
                  type="number"
                  onCommit={(v) => patch.mutate({ id: drawerRoute.id, body: { priority: Number(v) } })}
                />
              </Row>
              <Row k="Auth">{drawerRoute.auth_mode}</Row>
              <Row k="Timeout">{drawerRoute.timeout_seconds}s</Row>
              <Row k="Retries">{drawerRoute.retry_attempts}</Row>
              <Row k="ID">{drawerRoute.id}</Row>
            </dl>

            <div>
              <div className="eyebrow mb-3">origin pool</div>
              <RoutePool routeId={drawerRoute.id} primaryOriginId={drawerRoute.origin_id} allOrigins={origins} />
            </div>
          </div>
        )}
      </Drawer>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpatch {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Requests matching {confirmDelete?.path_pattern} will no longer be forwarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) remove.mutate(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              Unpatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-border/60 pb-2">
      <dt className="w-24 shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{k}</dt>
      <dd className="min-w-0 flex-1 break-all text-foreground">{children}</dd>
    </div>
  )
}

function Empty({ q, noOrigins, onAdd }: { q: string; noOrigins: boolean; onAdd: () => void }) {
  return (
    <div className="panel grid place-content-center gap-2 py-16 text-center">
      <p className="text-sm text-foreground">
        {q ? 'No route matches that.' : noOrigins ? 'No origins to patch to yet.' : 'Nothing patched.'}
      </p>
      {!q && (
        <p className="max-w-sm text-sm text-muted-foreground">
          {noOrigins
            ? 'Add an origin on the Origins panel first, then come back and patch a route to it.'
            : 'Patch your first route: a path pattern, the methods it covers, and an origin.'}
        </p>
      )}
      {!q && !noOrigins && (
        <Button variant="outline" size="sm" className="mx-auto mt-2" onClick={onAdd}>
          <Plus /> Patch a route
        </Button>
      )}
    </div>
  )
}
