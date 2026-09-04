'use client'

import { useQuery } from '@tanstack/react-query'
import { Minus, Plus } from 'lucide-react'
import { routesApi } from '@/lib/api/resources'
import { qk, useOptimisticMutation } from '@/lib/hooks/use-resource'
import type { Origin } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useState } from 'react'

/**
 * The set of origins a route load-balances across, on top of its primary.
 * Add pulls from origins not already in the pool; remove takes one out.
 */
export function RoutePool({
  routeId,
  primaryOriginId,
  allOrigins,
}: {
  routeId: string
  primaryOriginId: string
  allOrigins: Origin[]
}) {
  const key = qk.routePool(routeId)
  const [toAdd, setToAdd] = useState('')

  const { data: pool = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => routesApi.pool.list(routeId),
  })

  const add = useOptimisticMutation<string, void, Origin[]>({
    mutationFn: (originId) => routesApi.pool.add(routeId, originId),
    listKey: key,
    success: 'Added to pool',
  })
  const drop = useOptimisticMutation<string, void, Origin[]>({
    mutationFn: (originId) => routesApi.pool.remove(routeId, originId),
    listKey: key,
    optimistic: (cur, originId) => cur?.filter((o) => o.id !== originId),
    success: 'Removed from pool',
  })

  const inPool = new Set(pool.map((o) => o.id))
  const available = allOrigins.filter((o) => !inPool.has(o.id) && o.id !== primaryOriginId)

  if (isLoading) return <Skeleton className="h-24" />

  return (
    <div className="space-y-3">
      <ul className="ledger space-y-1 text-sm">
        <li className="flex items-center justify-between border-b border-border/60 pb-1.5">
          <span className="flex items-center gap-2">
            <span className={cn('lamp', 'lamp-on')} />
            {allOrigins.find((o) => o.id === primaryOriginId)?.name ?? primaryOriginId}
          </span>
          <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">primary</span>
        </li>
        {pool
          .filter((o) => o.id !== primaryOriginId)
          .map((o) => (
            <li key={o.id} className="flex items-center justify-between border-b border-border/40 pb-1.5">
              <span className="flex items-center gap-2">
                <span className={cn('lamp', o.is_healthy ? 'lamp-on' : 'lamp-off')} />
                {o.name}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => drop.mutate(o.id)} aria-label="Remove from pool">
                <Minus />
              </Button>
            </li>
          ))}
        {pool.filter((o) => o.id !== primaryOriginId).length === 0 && (
          <li className="py-1 text-xs text-muted-foreground">No secondary origins. Requests go to the primary only.</li>
        )}
      </ul>

      {available.length > 0 && (
        <div className="flex gap-2">
          <Select value={toAdd} onValueChange={setToAdd}>
            <SelectTrigger className="h-8 flex-1">
              <SelectValue placeholder="Add an origin…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={!toAdd || add.isPending}
            onClick={() => add.mutate(toAdd, { onSuccess: () => setToAdd('') })}
          >
            <Plus /> Add
          </Button>
        </div>
      )}
    </div>
  )
}
