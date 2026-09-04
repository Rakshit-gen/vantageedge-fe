'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Plus, RefreshCw } from 'lucide-react'
import { originsApi } from '@/lib/api/resources'
import { qk, useOptimisticMutation } from '@/lib/hooks/use-resource'
import { useListKeys } from '@/lib/hooks/use-list-keys'
import { useCommandMenu } from '@/components/command-menu'
import type { Origin } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { AddOriginDialog } from '@/components/dashboard/add-origin-dialog'
import { cn, relativeTime } from '@/lib/utils'

export default function OriginsPage() {
  const qc = useQueryClient()
  const searchRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Origin | null>(null)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Origin | null>(null)
  const cmd = useCommandMenu()
  const searchParams = useSearchParams()

  const { data: origins = [], isLoading } = useQuery({ queryKey: qk.origins, queryFn: originsApi.list })

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) setDrawerId(id)
  }, [searchParams])

  useEffect(() => cmd.register('origins', { 'New origin': () => { setEditing(null); setDialogOpen(true) } }), [cmd])

  const patch = useOptimisticMutation<{ id: string; body: Partial<Origin> }, Origin, Origin[]>({
    mutationFn: ({ id, body }) => originsApi.update(id, body),
    listKey: qk.origins,
    optimistic: (cur, { id, body }) => cur?.map((o) => (o.id === id ? { ...o, ...body } : o)),
    invalidate: [qk.origins, qk.routes],
  })

  const remove = useOptimisticMutation<string, void, Origin[]>({
    mutationFn: (id) => originsApi.remove(id),
    listKey: qk.origins,
    optimistic: (cur, id) => cur?.filter((o) => o.id !== id),
    success: 'Origin removed',
    invalidate: [qk.origins, qk.routes],
  })

  const filtered = origins.filter(
    (o) => o.name.toLowerCase().includes(q.toLowerCase()) || o.url.toLowerCase().includes(q.toLowerCase()),
  )

  const { cursor } = useListKeys({
    count: filtered.length,
    searchRef,
    onEnter: (i) => filtered[i] && setDrawerId(filtered[i].id),
  })

  const drawerOrigin = origins.find((o) => o.id === drawerId) ?? null

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Origins</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The backends in the pool. Weight sets the share of traffic; failing health checks pull an origin out.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus /> New origin
        </Button>
      </header>

      <Input
        ref={searchRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by name or URL   ( / )"
        className="max-w-sm"
      />

      <div className="panel">
        {isLoading ? (
          <Skeleton className="m-4 h-64" />
        ) : filtered.length === 0 ? (
          <Empty q={q} onAdd={() => { setEditing(null); setDialogOpen(true) }} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-20 text-right">Weight</TableHead>
                <TableHead className="w-24 text-right">Timeout</TableHead>
                <TableHead className="w-36">Last check</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o, i) => (
                <TableRow
                  key={o.id}
                  data-state={cursor === i ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => setDrawerId(o.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <span
                      className={cn('lamp', o.is_healthy ? 'lamp-on' : 'lamp-off')}
                      title={o.is_healthy ? 'healthy' : 'failing health checks'}
                    />
                  </TableCell>
                  <TableCell className="text-foreground">{o.name}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">{o.url}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <InlineEdit
                      value={o.weight}
                      type="number"
                      min={1}
                      onCommit={(v) => patch.mutate({ id: o.id, body: { weight: Number(v) } })}
                    />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <InlineEdit
                      value={o.timeout_seconds}
                      type="number"
                      min={1}
                      suffix="s"
                      onCommit={(v) => patch.mutate({ id: o.id, body: { timeout_seconds: Number(v) } })}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{relativeTime(o.last_health_check)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDrawerId(o.id)}>Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(o); setDialogOpen(true) }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => qc.invalidateQueries({ queryKey: qk.origins })}
                        >
                          <RefreshCw /> Re-poll health
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmDelete(o)}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <p className="ledger text-[11px] text-muted-foreground">
        j / k move · enter opens · / filters
      </p>

      <AddOriginDialog open={dialogOpen} onOpenChange={setDialogOpen} origin={editing} />

      <Drawer
        open={!!drawerOrigin}
        onOpenChange={(o) => !o && setDrawerId(null)}
        eyebrow="origin"
        title={drawerOrigin?.name ?? ''}
        footer={
          drawerOrigin && (
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => { setEditing(drawerOrigin); setDialogOpen(true); setDrawerId(null) }}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { setConfirmDelete(drawerOrigin); setDrawerId(null) }}>
                Remove
              </Button>
            </div>
          )
        }
      >
        {drawerOrigin && (
          <dl className="ledger space-y-3 text-sm">
            <Row k="Status">
              <span className="flex items-center gap-2">
                <span className={cn('lamp', drawerOrigin.is_healthy ? 'lamp-on' : 'lamp-off')} />
                {drawerOrigin.is_healthy ? 'healthy' : 'failing'}
              </span>
            </Row>
            <Row k="URL">{drawerOrigin.url}</Row>
            <Row k="Health path">{drawerOrigin.health_check_path}</Row>
            <Row k="Check interval">{drawerOrigin.health_check_interval}s</Row>
            <Row k="Weight">{drawerOrigin.weight}</Row>
            <Row k="Timeout">{drawerOrigin.timeout_seconds}s</Row>
            <Row k="Retries">{drawerOrigin.max_retries}</Row>
            <Row k="Last check">{relativeTime(drawerOrigin.last_health_check)}</Row>
            <Row k="ID">{drawerOrigin.id}</Row>
          </dl>
        )}
      </Drawer>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Routes patched to this origin will stop resolving until you point them elsewhere.
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
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border/60 pb-2">
      <dt className="w-28 shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{k}</dt>
      <dd className="min-w-0 flex-1 break-all text-foreground">{children}</dd>
    </div>
  )
}

function Empty({ q, onAdd }: { q: string; onAdd: () => void }) {
  return (
    <div className="grid place-content-center gap-2 py-16 text-center">
      <p className="text-sm text-foreground">{q ? 'No origin matches that.' : 'The pool is empty.'}</p>
      {!q && (
        <>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add the first backend the exchange should forward to.
          </p>
          <Button variant="outline" size="sm" className="mx-auto mt-2" onClick={onAdd}>
            <Plus /> New origin
          </Button>
        </>
      )}
    </div>
  )
}
