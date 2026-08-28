'use client'

import { cn } from '@/lib/utils'

/**
 * A gauge on the operator's panel: stamped label, big mono readout, one
 * optional sub-line. The unit of the overview and analytics header rows.
 */
export function Stat({
  label,
  value,
  sub,
  accent = 'default',
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  accent?: 'default' | 'patch' | 'lamp' | 'alert' | 'warning'
  className?: string
}) {
  return (
    <div className={cn('panel p-4', className)}>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'mono-num mt-2.5 text-[1.7rem] font-medium leading-none',
          accent === 'patch' && 'text-patch',
          accent === 'lamp' && 'text-lamp',
          accent === 'warning' && 'text-warning',
          accent === 'alert' && 'text-destructive',
        )}
      >
        {value}
      </div>
      {sub != null && <div className="mt-2 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}
