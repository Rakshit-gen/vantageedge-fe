'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The strip of numbers under the board: what the gateway would be reporting
 * while traffic crosses it. The figures drift on a slow random walk so the
 * panel reads as live rather than a screenshot; they hold still when the
 * visitor asks for reduced motion. Illustrative, not a real feed.
 */
const FIELDS = [
  { key: 'rps', label: 'req/s', base: 1240, swing: 90, dp: 0 },
  { key: 'p95', label: 'p95', base: 74, swing: 8, dp: 0, unit: 'ms' },
  { key: 'cache', label: 'cache hit', base: 63, swing: 4, dp: 0, unit: '%' },
] as const

export function BoardReadout() {
  const [vals, setVals] = useState<number[]>(() => FIELDS.map((f) => f.base))
  const raf = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let tick = 0
    const step = () => {
      tick++
      if (tick % 8 === 0) {
        setVals((prev) =>
          prev.map((v, i) => {
            const f = FIELDS[i]
            const next = v + (Math.random() - 0.5) * f.swing * 0.5
            return Math.max(f.base - f.swing, Math.min(f.base + f.swing, next))
          })
        )
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return (
    <div className="ledger flex flex-wrap items-stretch gap-px overflow-hidden rounded border border-border bg-border text-xs">
      {FIELDS.map((f, i) => (
        <div key={f.key} className="flex min-w-[7rem] flex-1 flex-col gap-1 bg-background px-4 py-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</span>
          <span className="mono-num text-lg text-foreground">
            {vals[i].toFixed(f.dp)}
            {'unit' in f && f.unit ? <span className="ml-0.5 text-xs text-muted-foreground">{f.unit}</span> : null}
          </span>
        </div>
      ))}
      <div className="flex min-w-[7rem] flex-1 flex-col gap-1 bg-background px-4 py-3">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">origins</span>
        <span className="mono-num flex items-center gap-1.5 text-lg text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lamp" />
          4/4
        </span>
      </div>
    </div>
  )
}
