'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TimeBucket } from '@/lib/types'
import { formatCompact, formatLatency } from '@/lib/utils'

// Warm ledger palette — patch-cord, signal lamp, ink.
export const INK = {
  patch: 'hsl(12 68% 54%)',
  lamp: 'hsl(82 22% 48%)',
  dim: 'hsl(40 7% 48%)',
  ochre: 'hsl(34 64% 50%)',
  brick: 'hsl(4 62% 52%)',
  grid: 'hsl(38 8% 16%)',
  axis: 'hsl(40 7% 46%)',
}

const axisProps = {
  stroke: INK.axis,
  tick: { fill: INK.axis, fontSize: 11, fontFamily: 'var(--font-mono)' },
  tickLine: false,
  axisLine: { stroke: INK.grid },
}

function TooltipBox({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="ledger rounded-[3px] border border-border bg-popover px-2.5 py-2 text-xs shadow-xl">
      {label != null && <div className="mb-1 text-muted-foreground">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-[1px]" style={{ background: p.color || p.fill }} />
          <span className="text-foreground">
            {p.name}: {unit === 'ms' ? formatLatency(p.value) : formatCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const hourFmt = (ts: string) =>
  new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export function ThroughputArea({ data, height = 240 }: { data: TimeBucket[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="tp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INK.patch} stopOpacity={0.22} />
            <stop offset="100%" stopColor={INK.patch} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={INK.grid} vertical={false} />
        <XAxis dataKey="ts" tickFormatter={hourFmt} {...axisProps} minTickGap={32} />
        <YAxis {...axisProps} tickFormatter={formatCompact} width={44} />
        <Tooltip content={<TooltipBox />} cursor={{ stroke: INK.grid }} />
        <Area
          type="monotone"
          dataKey="count"
          name="requests"
          stroke={INK.patch}
          strokeWidth={1.5}
          fill="url(#tp)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="error_count"
          name="errors"
          stroke={INK.brick}
          strokeWidth={1.25}
          strokeDasharray="3 3"
          fill="transparent"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function LatencyLine({ data, height = 240 }: { data: TimeBucket[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={INK.grid} vertical={false} />
        <XAxis dataKey="ts" tickFormatter={hourFmt} {...axisProps} minTickGap={32} />
        <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v)}`} width={44} />
        <Tooltip content={<TooltipBox unit="ms" />} cursor={{ stroke: INK.grid }} />
        <Line
          type="monotone"
          dataKey="avg_latency_ms"
          name="avg latency"
          stroke={INK.lamp}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function StatusBars({
  breakdown,
  height = 240,
}: {
  breakdown: Record<string, number>
  height?: number
}) {
  const data = Object.entries(breakdown)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => a.code.localeCompare(b.code))

  const colorFor = (code: string) =>
    code.startsWith('2')
      ? INK.lamp
      : code.startsWith('3')
        ? INK.dim
        : code.startsWith('4')
          ? INK.ochre
          : INK.brick

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={INK.grid} vertical={false} />
        <XAxis dataKey="code" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={formatCompact} width={44} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: 'hsl(38 8% 16% / 0.4)' }} />
        <Bar dataKey="count" name="requests" radius={[1, 1, 0, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.code} fill={colorFor(d.code)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CacheDonut({ hitRate, height = 200 }: { hitRate: number; height?: number }) {
  const data = [
    { name: 'hits', value: Math.round(hitRate * 1000) / 10 },
    { name: 'misses', value: Math.round((1 - hitRate) * 1000) / 10 },
  ]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius="62%"
          outerRadius="90%"
          stroke="none"
          startAngle={90}
          endAngle={-270}
          isAnimationActive={false}
        >
          <Cell fill={INK.lamp} />
          <Cell fill={INK.grid} />
        </Pie>
        <Tooltip content={<TooltipBox />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function Sparkline({ points, color = INK.patch }: { points: number[]; color?: string }) {
  const data = points.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={26}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.25} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
