'use client'

import { cn } from '@/lib/utils'
import type { AnalyticsWindow } from '@/lib/types'

const WINDOWS: AnalyticsWindow[] = ['1h', '24h', '7d', '30d']

export function WindowToggle({
  value,
  onChange,
}: {
  value: AnalyticsWindow
  onChange: (w: AnalyticsWindow) => void
}) {
  return (
    <div className="inline-flex rounded border border-border p-0.5">
      {WINDOWS.map((w) => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={cn(
            'rounded-[2px] px-2 py-1 font-mono text-[11px] transition-colors',
            value === w
              ? 'bg-patch text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {w}
        </button>
      ))}
    </div>
  )
}
