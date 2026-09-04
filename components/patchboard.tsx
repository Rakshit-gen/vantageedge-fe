'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export interface PatchJack {
  id: string
  label: string
  sub?: string
  state?: 'on' | 'warn' | 'off'
}

export interface PatchCable {
  from: string // left jack id
  to: string // right jack id
  live?: boolean
  active?: boolean
}

/**
 * The switchboard. Inbound routes are the jacks down the left rail, origins
 * the jacks down the right; a cable is a route patched to its origin. This is
 * the real routing table drawn as the thing it is. Hover a jack to trace its
 * cable; the rest fall back. One live cable carries a single travelling bead
 * unless motion is reduced.
 */
export function Patchboard({
  left,
  right,
  cables,
  onSelect,
  selectedId,
  className,
  height = 340,
}: {
  left: PatchJack[]
  right: PatchJack[]
  cables: PatchCable[]
  onSelect?: (cableIndex: number) => void
  selectedId?: string | null
  className?: string
  height?: number
}) {
  const uid = useId().replace(/[:]/g, '')
  const [hover, setHover] = useState<string | null>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setReduced(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])

  const W = 640
  const H = height
  const padY = 26
  const rowH = (side: PatchJack[]) => (side.length > 1 ? (H - padY * 2) / (side.length - 1) : 0)
  const yFor = (side: PatchJack[], i: number) =>
    side.length === 1 ? H / 2 : padY + i * rowH(side)

  const leftIndex = useMemo(() => new Map(left.map((j, i) => [j.id, i])), [left])
  const rightIndex = useMemo(() => new Map(right.map((j, i) => [j.id, i])), [right])

  const jackX = { left: 150, right: W - 150 }

  const traced = (c: PatchCable) =>
    hover == null ? true : c.from === hover || c.to === hover

  return (
    <div className={cn('panel relative overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="eyebrow after:hidden">switchboard</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {cables.length} patched / {left.length} in / {right.length} out
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-0">
        {/* left rail labels */}
        <ul className="ledger flex min-w-0 flex-col justify-between py-4 pl-3 pr-2 text-xs sm:pl-4" style={{ minHeight: H }}>
          {left.map((j) => (
            <li
              key={j.id}
              onMouseEnter={() => setHover(j.id)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                'flex items-center gap-2 truncate py-0.5 transition-opacity',
                hover && hover !== j.id && !cables.some((c) => c.from === j.id && c.to === hover) && 'opacity-40',
              )}
            >
              <span className={cn('lamp', j.state === 'warn' ? 'lamp-warn' : j.state === 'off' ? 'lamp-off' : 'lamp-on')} />
              <span className="min-w-0 truncate text-foreground">{j.label}</span>
            </li>
          ))}
        </ul>

        {/* board */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="none"
          className="col-start-2 h-full min-w-[160px] sm:min-w-[280px]"
          style={{ height: H }}
        >
          <defs>
            <linearGradient id={`${uid}-cable`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="hsl(var(--muted-foreground) / 0.5)" />
              <stop offset="1" stopColor="hsl(var(--muted-foreground) / 0.5)" />
            </linearGradient>
          </defs>

          {/* rails */}
          <line x1={jackX.left} y1={8} x2={jackX.left} y2={H - 8} stroke="hsl(var(--border))" />
          <line x1={jackX.right} y1={8} x2={jackX.right} y2={H - 8} stroke="hsl(var(--border))" />

          {/* cables */}
          {cables.map((c, i) => {
            const li = leftIndex.get(c.from)
            const ri = rightIndex.get(c.to)
            if (li == null || ri == null) return null
            const y1 = yFor(left, li)
            const y2 = yFor(right, ri)
            const x1 = jackX.left
            const x2 = jackX.right
            const midX = (x1 + x2) / 2
            const sag = 18 + Math.abs(y1 - y2) * 0.12
            const d = `M ${x1} ${y1} C ${midX} ${y1 + sag}, ${midX} ${y2 + sag}, ${x2} ${y2}`
            const isTraced = traced(c)
            const isSel = selectedId != null && (c.from === selectedId || c.to === selectedId)
            const stroke = !c.active
              ? 'hsl(var(--muted-foreground) / 0.35)'
              : c.live
                ? 'hsl(var(--patch))'
                : 'hsl(var(--lamp))'
            return (
              <g key={i} opacity={isTraced ? 1 : 0.18} style={{ transition: 'opacity .15s' }}>
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isSel ? 2.5 : 1.5}
                  strokeDasharray={c.active ? undefined : '2 4'}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(c.from)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect?.(i)}
                />
                {c.live && !reduced && isTraced && (
                  <circle r={2.6} fill="hsl(var(--patch))">
                    <animateMotion dur="2.6s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            )
          })}

          {/* jacks */}
          {left.map((j, i) => (
            <circle
              key={j.id}
              cx={jackX.left}
              cy={yFor(left, i)}
              r={3.5}
              fill={hover === j.id ? 'hsl(var(--patch))' : 'hsl(var(--foreground))'}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            />
          ))}
          {right.map((j, i) => (
            <circle
              key={j.id}
              cx={jackX.right}
              cy={yFor(right, i)}
              r={3.5}
              fill={hover === j.id ? 'hsl(var(--patch))' : 'hsl(var(--foreground))'}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* right rail labels */}
        <ul className="ledger col-start-3 flex min-w-0 flex-col justify-between py-4 pl-2 pr-3 text-right text-xs sm:pr-4" style={{ minHeight: H }}>
          {right.map((j) => (
            <li
              key={j.id}
              onMouseEnter={() => setHover(j.id)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                'flex items-center justify-end gap-2 truncate py-0.5 transition-opacity',
                hover && hover !== j.id && !cables.some((c) => c.to === j.id && c.from === hover) && 'opacity-40',
              )}
            >
              <span className="min-w-0 truncate text-foreground">{j.label}</span>
              <span className={cn('lamp', j.state === 'warn' ? 'lamp-warn' : j.state === 'off' ? 'lamp-off' : 'lamp-on')} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
