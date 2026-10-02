'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Type a request and see which route the gateway would pick. The matching is
 * a port of internal/gateway/router/match.go: `*` matches any run of
 * characters (slashes included), routes are tried highest priority first, and
 * the first one whose path and method both match wins.
 */

export function matchPath(pattern: string, path: string): boolean {
  if (!pattern) return false
  if (!pattern.includes('*')) return pattern === path
  const segs = pattern.split('*')
  if (!path.startsWith(segs[0])) return false
  let rest = path.slice(segs[0].length)
  const last = segs.length - 1
  if (!rest.endsWith(segs[last])) return false
  rest = rest.slice(0, rest.length - segs[last].length)
  for (const seg of segs.slice(1, last)) {
    if (!seg) continue
    const i = rest.indexOf(seg)
    if (i === -1) return false
    rest = rest.slice(i + seg.length)
  }
  return true
}

const matchMethod = (methods: string[], m: string) =>
  methods.length === 0 || methods.some((x) => x.toUpperCase() === m.toUpperCase())

interface Row {
  key: number
  pattern: string
  methods: string
  priority: number
}

const START: Row[] = [
  { key: 1, pattern: '/api/orders/export', methods: 'GET', priority: 20 },
  { key: 2, pattern: '/api/orders/*', methods: 'GET, POST', priority: 10 },
  { key: 3, pattern: '/api/*/health', methods: 'GET', priority: 5 },
  { key: 4, pattern: '/api/*', methods: '', priority: 0 },
]

const TRY = ['/api/orders/1042', '/api/orders', '/api/orders/export', '/api/billing/health', '/status']
const VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

type Verdict = 'win' | 'shadowed' | 'method' | 'path'

export function RouteMatcher() {
  const [rows, setRows] = useState<Row[]>(START)
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState(TRY[0])
  const [nextKey, setNextKey] = useState(5)

  const parsed = rows.map((r) => ({
    ...r,
    list: r.methods.split(',').map((m) => m.trim()).filter(Boolean),
  }))
  // Same order the gateway uses. Equal priorities have no guaranteed order.
  const ordered = [...parsed].sort((a, b) => b.priority - a.priority)
  const winner = ordered.find((r) => matchPath(r.pattern, path) && matchMethod(r.list, method))
  const tie =
    winner &&
    ordered.find(
      (r) => r !== winner && r.priority === winner.priority && matchPath(r.pattern, path) && matchMethod(r.list, method),
    )

  const verdict = (r: (typeof parsed)[number]): [Verdict, string] => {
    if (r === winner) return ['win', 'Matches. This route handles the request.']
    const pathOk = matchPath(r.pattern, path)
    if (pathOk && matchMethod(r.list, method)) return ['shadowed', `Also matches, but priority ${winner!.priority} is tried first.`]
    if (pathOk) return ['method', `Path matches, but ${method} isn't in its methods.`]
    if (r.pattern.endsWith('/*') && path === r.pattern.slice(0, -2)) {
      return ['path', `Needs something after ${r.pattern.slice(0, -1)}. Add a route for ${path} itself if you want it.`]
    }
    return ['path', 'Path does not match.']
  }

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  return (
    <div className="not-prose overflow-hidden rounded border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2.5">
        <label className="sr-only" htmlFor="rm-method">Method</label>
        <select
          id="rm-method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="ledger rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
        >
          {VERBS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="rm-path">Request path</label>
        <input
          id="rm-path"
          value={path}
          onChange={(e) => setPath(e.target.value.trim())}
          spellCheck={false}
          className="ledger min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:border-patch focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2 text-[11px]">
        <span className="text-muted-foreground">Try:</span>
        {TRY.map((t) => (
          <button
            key={t}
            onClick={() => setPath(t)}
            className={cn('ledger rounded-[2px] px-1.5', t === path ? 'bg-patch/15 text-patch' : 'text-muted-foreground hover:text-foreground')}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="ledger text-xs">
        <div className="hidden grid-cols-[4rem_minmax(0,1fr)_7rem_minmax(0,1.3fr)_1.5rem] gap-2 border-b border-border/70 px-3 py-1.5 text-[11px] text-muted-foreground sm:grid">
          <span>Priority</span>
          <span>Path pattern</span>
          <span>Methods</span>
          <span>Result</span>
          <span />
        </div>
        {ordered.map((r) => {
          const [v, why] = verdict(r)
          return (
            <div
              key={r.key}
              className={cn(
                'grid grid-cols-[4rem_minmax(0,1fr)_1.5rem] items-center gap-2 border-b border-border/70 px-3 py-2 last:border-0 sm:grid-cols-[4rem_minmax(0,1fr)_7rem_minmax(0,1.3fr)_1.5rem]',
                v === 'win' && 'bg-patch/10',
              )}
            >
              <input
                type="number"
                aria-label="Priority"
                value={r.priority}
                onChange={(e) => update(r.key, { priority: Number(e.target.value) || 0 })}
                className="w-full rounded border border-input bg-background px-1.5 py-0.5 text-foreground"
              />
              <input
                aria-label="Path pattern"
                value={r.pattern}
                onChange={(e) => update(r.key, { pattern: e.target.value.trim() })}
                spellCheck={false}
                className="w-full rounded border border-input bg-background px-1.5 py-0.5 text-foreground"
              />
              <input
                aria-label="Methods, comma separated, empty for all"
                value={r.methods}
                placeholder="all"
                onChange={(e) => update(r.key, { methods: e.target.value })}
                spellCheck={false}
                className="col-span-2 col-start-1 row-start-2 w-full rounded border border-input bg-background px-1.5 py-0.5 text-foreground placeholder:text-muted-foreground sm:col-span-1 sm:col-start-auto sm:row-start-auto"
              />
              <span
                className={cn(
                  'col-span-3 sm:col-span-1',
                  v === 'win' ? 'text-patch' : v === 'shadowed' ? 'text-warning' : 'text-muted-foreground',
                )}
              >
                {why}
              </span>
              <button
                aria-label="Remove route"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="col-start-3 row-start-1 text-muted-foreground hover:text-foreground sm:col-start-auto sm:row-start-auto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-3 py-2 text-xs">
        <span className={cn(winner ? 'text-foreground' : 'text-destructive')}>
          {winner
            ? `${method} ${path} goes to ${winner.pattern}.`
            : `${method} ${path} matches no route: 404 Route not found.`}
          {tie && (
            <span className="ml-1 text-warning">
              {tie.pattern} has the same priority, so which one wins is not guaranteed. Give them different priorities.
            </span>
          )}
        </span>
        <button
          onClick={() => {
            setRows((rs) => [...rs, { key: nextKey, pattern: '/new/*', methods: 'GET', priority: 0 }])
            setNextKey((k) => k + 1)
          }}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add a route
        </button>
      </div>
    </div>
  )
}
