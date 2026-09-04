'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api/resources'
import { qk } from '@/lib/hooks/use-resource'
import type { AnalyticsWindow } from '@/lib/types'
import { Stat } from '@/components/stat'
import { WindowToggle } from '@/components/window-toggle'
import { CacheDonut, LatencyLine, Sparkline, StatusBars, ThroughputArea } from '@/components/charts'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCompact, formatLatency, formatPercent, relativeTime } from '@/lib/utils'

export default function TrafficPage() {
  const [win, setWin] = useState<AnalyticsWindow>('24h')
  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.analytics(win),
    queryFn: () => analyticsApi.get(win),
    refetchInterval: 20_000,
  })

  const t = data?.totals

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Traffic</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read from the request log. Updated {data ? relativeTime(data.generated_at) : '…'};
            polling every 20s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="lamp lamp-on" />
            {isFetching ? 'reading' : 'live'}
          </span>
          <WindowToggle value={win} onChange={setWin} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading || !t ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <Stat label="Requests" value={formatCompact(t.total_requests)} accent="patch" />
            <Stat label="Errors" value={formatPercent(t.error_rate)} accent={t.error_rate > 0.05 ? 'alert' : 'default'} />
            <Stat label="Rate-limited" value={formatCompact(t.rate_limited_count)} accent="warning" />
            <Stat label="p95 latency" value={formatLatency(t.p95_latency_ms)} accent="lamp" sub={`avg ${formatLatency(t.avg_latency_ms)}`} />
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="throughput">
          {isLoading ? (
            <Skeleton className="h-[240px]" />
          ) : !data ? (
            <NoData />
          ) : (
            <ThroughputArea data={data.series} />
          )}
        </Panel>
        <Panel title="latency (avg)">
          {isLoading ? (
            <Skeleton className="h-[240px]" />
          ) : !data ? (
            <NoData />
          ) : (
            <LatencyLine data={data.series} />
          )}
        </Panel>
        <Panel title="status codes">
          {isLoading ? (
            <Skeleton className="h-[240px]" />
          ) : !data ? (
            <NoData />
          ) : (
            <StatusBars breakdown={data.status_breakdown} />
          )}
        </Panel>
        <Panel title="cache hit rate">
          {isLoading ? (
            <Skeleton className="h-[200px]" />
          ) : !data ? (
            <NoData />
          ) : (
            <div className="relative">
              <CacheDonut hitRate={t?.cache_hit_rate ?? 0} />
              <div className="pointer-events-none absolute inset-0 grid place-content-center">
                <span className="mono-num text-2xl text-lamp">{formatPercent(t?.cache_hit_rate ?? 0)}</span>
              </div>
            </div>
          )}
        </Panel>
      </section>

      <section className="space-y-3">
        <div className="eyebrow">routes by volume</div>
        <div className="panel">
          {isLoading ? (
            <Skeleton className="m-4 h-56" />
          ) : (data?.top_routes ?? []).length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">No routes have taken traffic yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead className="w-24 text-right">Requests</TableHead>
                  <TableHead className="w-24 text-right">Avg</TableHead>
                  <TableHead className="w-20 text-right">Errors</TableHead>
                  <TableHead className="w-28">Shape</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.top_routes.map((r) => (
                  <TableRow key={r.path}>
                    <TableCell className="max-w-[240px] truncate text-foreground">{r.path}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCompact(r.count)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatLatency(r.avg_latency_ms)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.error_count > 0 ? <span className="text-destructive">{r.error_count}</span> : '0'}
                    </TableCell>
                    <TableCell>
                      <Sparkline points={sparkFor(data!.series, r.count)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="eyebrow">{title}</div>
      <div className="panel p-4">{children}</div>
    </div>
  )
}

function NoData() {
  return (
    <div className="grid h-[240px] place-content-center text-sm text-muted-foreground">
      Couldn't load this — retrying.
    </div>
  )
}

// The per-route series isn't broken out by the endpoint, so shape the overall
// throughput curve to the route's share — enough to read the trend, honest
// about being an approximation.
function sparkFor(series: { count: number }[], routeTotal: number): number[] {
  const overall = series.reduce((s, b) => s + b.count, 0) || 1
  const share = routeTotal / overall
  return series.map((b) => b.count * share)
}
