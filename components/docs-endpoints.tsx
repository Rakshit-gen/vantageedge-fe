'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDocsConfig } from './docs-config'

export type Endpoint = { verb: string; path: string; desc: string; note?: string }

const VERB_TONE: Record<string, string> = {
  GET: 'text-lamp',
  POST: 'text-patch',
  PATCH: 'text-warning',
  PUT: 'text-warning',
  DELETE: 'text-destructive',
}

/** The endpoint list for a section. Rows with a note expand to show it. */
export function Endpoints({ rows }: { rows: Endpoint[] }) {
  return (
    <div className="ledger overflow-hidden rounded border border-border text-xs">
      {rows.map((r, i) => (
        <Row key={i} row={r} last={i === rows.length - 1} />
      ))}
    </div>
  )
}

function Row({ row, last }: { row: Endpoint; last: boolean }) {
  const [open, setOpen] = useState(false)
  const { host } = useDocsConfig()
  const base = host || '<host>'

  return (
    <div className={cn(!last && 'border-b border-border/70')}>
      <button
        onClick={() => row.note && setOpen((v) => !v)}
        aria-expanded={row.note ? open : undefined}
        className={cn(
          'flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-left',
          row.note ? 'hover:bg-accent/40' : 'cursor-default',
        )}
      >
        <span className={cn('w-16 shrink-0 uppercase', VERB_TONE[row.verb] ?? 'text-muted-foreground')}>
          {row.verb}
        </span>
        <code className="min-w-0 break-all text-foreground">{row.path}</code>
        <span className="basis-full text-muted-foreground sm:basis-auto">{row.desc}</span>
        {row.note && (
          <ChevronRight
            className={cn(
              'ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-90',
            )}
          />
        )}
      </button>
      {open && row.note && (
        <div className="border-t border-border/70 bg-card/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <div className="mb-1 break-all text-foreground">
            {row.verb} https://{base}/api/v1{row.path}
          </div>
          {row.note}
        </div>
      )}
    </div>
  )
}
