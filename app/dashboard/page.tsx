'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { analyticsApi, originsApi, routesApi } from '@/lib/api/resources'
import { qk } from '@/lib/hooks/use-resource'
import type { AnalyticsWindow } from '@/lib/types'
import { Stat } from '@/components/stat'
import { Patchboard, type PatchCable, type PatchJack } from '@/components/patchboard'
import { ThroughputArea } from '@/components/charts'
import { Skeleton } from '@/components/ui/skeleton'
import { WindowToggle } from '@/components/window-toggle'
import { formatCompact, formatLatency, formatPercent, truncate } from '@/lib/utils'

export default function BoardPage() {
  const router = useRouter()
  const [win, setWin] = useState<AnalyticsWindow>('24h')

  const analytics = useQuery({
    queryKey: qk.analytics(win),
    queryFn: () => analyticsApi.get(win),
    refetchInterval: 20_000,
  })
  const origins = useQuery({ queryKey: qk.origins, queryFn: originsApi.list })
  const routes = useQuery({ queryKey: qk.routes, queryFn: routesApi.list })

  const { left, right, cables } = useMemo(() => {
    const os = origins.data ?? []
    const rs = (routes.data ?? []).slice(0, 12)
    const usedOrigins = new Set(rs.map((r) => r.origin_id))
    const left: PatchJack[] = rs.map((r) => ({
      id: r.id,
      label: truncate(r.path_pattern, 22),
      state: r.is_active ? 'on' : 'off',
    }))
    const right: PatchJack[] = os
      .filter((o) => usedOrigins.has(o.id) || os.length <= 8)
      .slice(0, 12)
      .map((o) => ({
        id: o.id,
        label: truncate(o.name, 20),
        state: o.is_healthy ? 'on' : 'off',
      }))
    const rightIds = new Set(right.map((j) => j.id))
    const cables: PatchCable[] = rs
      .filter((r) => rightIds.has(r.origin_id))
      .map((r) => ({ from: r.id, to: r.origin_id, active: r.is_active, live: r.is_active }))
    return { left, right, cables }
  }, [origins.data, routes.data])

  const t = analytics.data?.totals
  const degraded = (origins.data ?? []).filter((o) => !o.is_healthy)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">The board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every route patched through the exchange, and what crossed it{' '}
            {win === '1h' ? 'this hour' : win === '24h' ? 'today' : `over ${win}`}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="lamp lamp-on" />
            {analytics.isFetching ? 'reading' : 'live'}
          </span>
          <WindowToggle value={win} onChange={setWin} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {analytics.isLoading || !t ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <Stat label="Requests" value={formatCompact(t.total_requests)} accent="patch" />
            <Stat
              label="Error rate"
              value={formatPercent(t.error_rate)}
              accent={t.error_rate > 0.05 ? 'alert' : 'default'}
              sub={`${formatCompact(Math.round(t.total_requests * t.error_rate))} failed`}
            />
            <Stat
              label="p95 latency"
              value={formatLatency(t.p95_latency_ms)}
              accent="lamp"
              sub={`avg ${formatLatency(t.avg_latency_ms)}`}
            />
            <Stat label="Cache hit rate" value={formatPercent(t.cache_hit_rate)} accent="lamp" />
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="eyebrow">switchboard</div>
        {routes.isLoading || origins.isLoading ? (
          <Skeleton className="h-[340px]" />
        ) : cables.length === 0 ? (
          <EmptyBoard hasRoutes={(routes.data ?? []).length > 0} />
        ) : (
          <Patchboard
            left={left}
            right={right}
            cables={cables}
            onSelect={(i) => {
              const c = cables[i]
              if (c) router.push(`/dashboard/routes?id=${c.from}`)
            }}
          />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <div className="eyebrow">throughput</div>
          <div className="panel p-4">
            {analytics.isLoading ? (
              <Skeleton className="h-[240px]" />
            ) : (analytics.data?.series ?? []).length === 0 ? (
              <p className="grid h-[240px] place-content-center text-sm text-muted-foreground">
                No traffic recorded yet.
              </p>
            ) : (
              <ThroughputArea data={analytics.data!.series} />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="eyebrow">busiest paths</div>
          <div className="panel divide-y divide-border/70">
            {(analytics.data?.top_routes ?? []).slice(0, 6).map((r) => (
              <div key={r.path} className="ledger flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                <span className="truncate text-foreground">{r.path}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatCompact(r.count)} · {formatLatency(r.avg_latency_ms)}
                </span>
              </div>
            ))}
            {(analytics.data?.top_routes ?? []).length === 0 && !analytics.isLoading && (
              <p className="px-4 py-6 text-sm text-muted-foreground">Nothing has come through yet.</p>
            )}
            {analytics.isLoading && <Skeleton className="m-4 h-40" />}
          </div>
        </div>
      </section>

      {degraded.length > 0 && (
        <section className="space-y-3">
          <div className="eyebrow">attention</div>
          <div className="panel border-destructive/40 p-4">
            <p className="text-sm">
              <span className="font-medium text-destructive">{degraded.length}</span>{' '}
              {degraded.length === 1 ? 'origin is' : 'origins are'} failing health checks:{' '}
              {degraded.map((o) => o.name).join(', ')}.{' '}
              <a href="/dashboard/services" className="inline-flex items-center gap-0.5 text-patch hover:underline">
                Open origins <ArrowUpRight className="h-3 w-3" />
              </a>
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function EmptyBoard({ hasRoutes }: { hasRoutes: boolean }) {
  return (
    <div className="panel grid place-content-center gap-2 py-16 text-center">
      <p className="text-sm text-foreground">The switchboard is unpatched.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasRoutes
          ? 'Your routes point at origins that are not in the pool yet.'
          : 'Add an origin, then patch a route to it. Traffic follows the cable.'}
      </p>
      <div className="mt-2 flex justify-center gap-2 font-mono text-xs">
        <a href="/dashboard/services" className="text-patch hover:underline">
          + origin
        </a>
        <span className="text-border">·</span>
        <a href="/dashboard/routes" className="text-patch hover:underline">
          + route
        </a>
      </div>
    </div>
  )
}
