'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * The landing-page board, runnable. Click a path and a request travels its
 * line through the route's checks (auth, rate limit, cache) to an origin in the
 * pool; click an origin to fail its health check and watch the pool re-split.
 * Everything is simulated in the browser with the same rules the gateway uses:
 * a token bucket per route, a TTL cache per route, weighted choice among
 * healthy origins.
 */

type Auth = 'public' | 'jwt' | 'apikey'
type Check = 'auth' | 'limit' | 'cache'

interface DemoRoute {
  id: string
  label: string
  sample: string
  auth: Auth
  burst: number
  refillPerSec: number
  cacheTtl: number
  pool: string[]
  on: boolean
}

interface DemoOrigin {
  id: string
  label: string
  weight: number
  ms: [number, number]
}

const ROUTES: DemoRoute[] = [
  { id: 'orders', label: '/api/orders/*', sample: '/api/orders/1042', auth: 'jwt', burst: 20, refillPerSec: 10, cacheTtl: 0, pool: ['orders-1', 'orders-2', 'orders-3'], on: true },
  { id: 'catalog', label: '/api/catalog/*', sample: '/api/catalog/items?tag=new', auth: 'public', burst: 20, refillPerSec: 10, cacheTtl: 30, pool: ['catalog'], on: true },
  { id: 'auth', label: '/api/auth/*', sample: '/api/auth/session', auth: 'public', burst: 20, refillPerSec: 10, cacheTtl: 0, pool: ['identity'], on: true },
  { id: 'search', label: '/api/search', sample: '/api/search?q=boots', auth: 'apikey', burst: 3, refillPerSec: 0.3, cacheTtl: 0, pool: ['search'], on: true },
  { id: 'stripe', label: '/webhooks/stripe', sample: '/webhooks/stripe', auth: 'public', burst: 20, refillPerSec: 10, cacheTtl: 0, pool: ['identity'], on: false },
]

const ORIGINS: DemoOrigin[] = [
  { id: 'orders-1', label: 'orders-svc-1', weight: 50, ms: [28, 44] },
  { id: 'orders-2', label: 'orders-svc-2', weight: 30, ms: [30, 48] },
  { id: 'orders-3', label: 'orders-svc-3', weight: 20, ms: [34, 55] },
  { id: 'catalog', label: 'catalog-svc', weight: 100, ms: [18, 30] },
  { id: 'identity', label: 'identity', weight: 100, ms: [12, 22] },
  { id: 'search', label: 'search-cluster', weight: 100, ms: [60, 95] },
]

const POLICY_TEXT = (r: DemoRoute) =>
  [
    r.auth === 'public' ? 'no auth' : r.auth === 'jwt' ? 'JWT' : 'API key',
    `burst ${r.burst}`,
    r.cacheTtl ? `cache ${r.cacheTtl}s` : 'no cache',
  ].join(' · ')

// Board geometry, in viewBox units.
const W = 800
const ROW = 46
const PAD = 30
const H = PAD * 2 + ROW * (ORIGINS.length - 1)
const X_JACK_L = 196
const X_SPLIT = 470
const X_JACK_R = 590
const CHECK_T: Record<Check, number> = { auth: 0.3, limit: 0.55, cache: 0.8 }

type Pt = { x: number; y: number }
const bez = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}

const routeY = (i: number) => PAD + (i * (H - PAD * 2)) / (ROUTES.length - 1)
const originY = (id: string) => PAD + ORIGINS.findIndex((o) => o.id === id) * ROW
const splitY = (r: DemoRoute) => r.pool.reduce((s, id) => s + originY(id), 0) / r.pool.length

function trunk(i: number): [Pt, Pt, Pt, Pt] {
  const r = ROUTES[i]
  const y1 = routeY(i)
  const y2 = splitY(r)
  return [
    { x: X_JACK_L, y: y1 },
    { x: X_JACK_L + 120, y: y1 },
    { x: X_SPLIT - 120, y: y2 },
    { x: X_SPLIT, y: y2 },
  ]
}

function strand(i: number, originId: string): [Pt, Pt, Pt, Pt] {
  const y1 = splitY(ROUTES[i])
  const y2 = originY(originId)
  return [
    { x: X_SPLIT, y: y1 },
    { x: X_SPLIT + 60, y: y1 },
    { x: X_JACK_R - 60, y: y2 },
    { x: X_JACK_R, y: y2 },
  ]
}

const pathD = ([a, b, c, d]: Pt[]) => `M ${a.x} ${a.y} C ${b.x} ${b.y}, ${c.x} ${c.y}, ${d.x} ${d.y}`

type Tone = 'ok' | 'warn' | 'err'

interface Outcome {
  status: number
  ms: number
  where: string
  tone: Tone
  stop: number // 0..1 along the trunk, or 2 when it reaches an origin
  origin?: string
}

interface Dot {
  key: number
  route: number
  start: number
  dur: number
  out: Outcome
  logged: boolean
}

interface LogLine {
  key: number
  path: string
  out: Outcome
}

const rand = (a: number, b: number) => Math.round(a + Math.random() * (b - a))

function pickWeighted(ids: string[]): string {
  const total = ids.reduce((s, id) => s + ORIGINS.find((o) => o.id === id)!.weight, 0)
  let n = Math.random() * total
  for (const id of ids) {
    n -= ORIGINS.find((o) => o.id === id)!.weight
    if (n <= 0) return id
  }
  return ids[ids.length - 1]
}

export function BoardDemo() {
  const [down, setDown] = useState<Set<string>>(new Set())
  const [creds, setCreds] = useState(true)
  const [hover, setHover] = useState<number | null>(null)
  const [log, setLog] = useState<LogLine[]>([])
  const [, setFrame] = useState(0)

  const dots = useRef<Dot[]>([])
  const buckets = useRef(ROUTES.map((r) => ({ tokens: r.burst, at: 0 })))
  const cachedAt = useRef<number[]>(ROUTES.map(() => -Infinity))
  const raf = useRef(0)
  const seq = useRef(0)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const tick = useCallback(() => {
    const now = performance.now()
    const arrived: LogLine[] = []
    for (const d of dots.current) {
      if (!d.logged && now >= d.start + d.dur) {
        d.logged = true
        arrived.push({ key: d.key, path: ROUTES[d.route].sample, out: d.out })
      }
    }
    if (arrived.length) setLog((l) => [...arrived.reverse(), ...l].slice(0, 6))
    // Keep a finished dot on screen briefly in its result colour, then drop it.
    dots.current = dots.current.filter((d) => now < d.start + d.dur + 700)
    setFrame((f) => f + 1)
    if (dots.current.length) raf.current = requestAnimationFrame(tick)
  }, [])

  const send = (i: number) => {
    const now = performance.now()
    const out = decide(i, now)
    // 600ms for the trunk, 200ms more to reach an origin; an early stop is shorter.
    const dur = reduced.current ? 0 : out.stop > 1 ? 800 : Math.max(120, out.stop * 600)
    dots.current.push({ key: ++seq.current, route: i, start: now, dur, out, logged: false })
    if (dots.current.length === 1) raf.current = requestAnimationFrame(tick)
  }

  function decide(i: number, now: number): Outcome {
    const r = ROUTES[i]
    if (!r.on) return { status: 404, ms: 1, where: 'route turned off', tone: 'err', stop: 0.06 }
    if (r.auth !== 'public' && !creds) {
      return { status: 401, ms: rand(1, 3), where: r.auth === 'jwt' ? 'no JWT' : 'no API key', tone: 'err', stop: CHECK_T.auth }
    }
    const b = buckets.current[i]
    b.tokens = Math.min(r.burst, b.tokens + ((now - b.at) / 1000) * r.refillPerSec)
    b.at = now
    if (b.tokens < 1) return { status: 429, ms: 1, where: 'rate limited', tone: 'warn', stop: CHECK_T.limit }
    b.tokens -= 1
    if (r.cacheTtl && now - cachedAt.current[i] < r.cacheTtl * 1000) {
      return { status: 200, ms: rand(1, 3), where: 'cache hit', tone: 'ok', stop: CHECK_T.cache }
    }
    const healthy = r.pool.filter((id) => !down.has(id))
    if (!healthy.length) return { status: 503, ms: rand(2, 4), where: 'no healthy origin', tone: 'err', stop: 1 }
    const origin = pickWeighted(healthy)
    const o = ORIGINS.find((x) => x.id === origin)!
    if (r.cacheTtl) cachedAt.current[i] = now
    return { status: 200, ms: rand(...o.ms), where: o.label + (r.cacheTtl ? ', cached' : ''), tone: 'ok', stop: 2, origin }
  }

  const toggleOrigin = (id: string) =>
    setDown((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  // Share of the pool each origin gets right now, after health checks.
  const share = (r: DemoRoute, id: string) => {
    if (down.has(id)) return 0
    const healthy = r.pool.filter((x) => !down.has(x))
    const total = healthy.reduce((s, x) => s + ORIGINS.find((o) => o.id === x)!.weight, 0)
    return ORIGINS.find((o) => o.id === id)!.weight / total
  }
  const poolOf = (id: string) => ROUTES.find((r) => r.on && r.pool.includes(id))

  const now = typeof performance === 'undefined' ? 0 : performance.now()
  const busy = new Set(dots.current.filter((d) => now < d.start + d.dur).map((d) => d.route))

  const dotPos = (d: Dot): Pt => {
    const p = d.dur ? Math.min(1, (now - d.start) / d.dur) : 1
    const along = p * d.out.stop
    if (along <= 1) return bez(...trunk(d.route), along)
    return bez(...strand(d.route, d.out.origin!), along - 1)
  }

  const toneFill: Record<Tone, string> = {
    ok: 'hsl(var(--lamp))',
    warn: 'hsl(var(--warning))',
    err: 'hsl(var(--destructive))',
  }

  const onKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fn()
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
        <span className="eyebrow after:hidden">
          {ROUTES.length} routes, {ORIGINS.length} origins
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={creds}
            onChange={(e) => setCreds(e.target.checked)}
            className="h-3.5 w-3.5 accent-[hsl(var(--patch))]"
          />
          Send with a JWT and API key
        </label>
      </div>

      {/* wide screens: the drawn board */}
      <svg viewBox={`0 0 ${W} ${H}`} className="hidden w-full sm:block" role="group" aria-label="Example routes and origins">
        {ROUTES.map((r, i) => {
          const t = trunk(i)
          const dim = hover != null && hover !== i
          const lineColor = !r.on
            ? 'hsl(var(--muted-foreground) / 0.45)'
            : busy.has(i)
              ? 'hsl(var(--patch))'
              : 'hsl(var(--lamp))'
          const checks: Check[] = [
            ...(r.auth !== 'public' ? (['auth'] as const) : []),
            'limit' as const,
            ...(r.cacheTtl ? (['cache'] as const) : []),
          ]
          return (
            <g key={r.id} opacity={dim ? 0.22 : 1} style={{ transition: 'opacity .15s' }}>
              <path d={pathD(t)} fill="none" stroke={lineColor} strokeWidth={1.6} strokeDasharray={r.on ? undefined : '3 5'} />
              {r.on &&
                r.pool.map((id) => {
                  const s = share(r, id)
                  return (
                    <path
                      key={id}
                      d={pathD(strand(i, id))}
                      fill="none"
                      stroke={s === 0 ? 'hsl(var(--destructive) / 0.6)' : lineColor}
                      strokeWidth={s === 0 ? 1 : 1 + s * 4}
                      strokeDasharray={s === 0 ? '2 4' : undefined}
                    />
                  )
                })}
              {r.on &&
                checks.map((c) => {
                  const p = bez(...t, CHECK_T[c])
                  return (
                    <g key={c}>
                      <rect x={p.x - 4} y={p.y - 4} width={8} height={8} rx={1.5} fill="hsl(var(--card))" stroke={lineColor} strokeWidth={1.3} />
                      {hover === i && (
                        <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" className="font-mono">
                          {c}
                        </text>
                      )}
                    </g>
                  )
                })}
              <g
                role="button"
                tabIndex={0}
                aria-label={`Send GET ${r.sample}`}
                className="group cursor-pointer outline-none [&:focus-visible>rect]:stroke-[hsl(var(--ring))]"
                onClick={() => send(i)}
                onKeyDown={onKey(() => send(i))}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <rect
                  x={2}
                  y={routeY(i) - 15}
                  width={X_JACK_L - 14}
                  height={30}
                  rx={3}
                  className="fill-[hsl(var(--card))] stroke-[hsl(var(--border))] transition-colors group-hover:fill-[hsl(var(--accent))] group-hover:stroke-[hsl(var(--patch))]"
                />
                <text x={12} y={routeY(i) + 4} fontSize={13} fill="hsl(var(--foreground))" className="font-mono">
                  {r.label}
                </text>
                <text x={X_JACK_L - 22} y={routeY(i) + 4} textAnchor="end" fontSize={11} className="fill-[hsl(var(--patch))] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  send
                </text>
              </g>
              {hover === i && (
                <text x={(X_JACK_L + X_SPLIT) / 2} y={Math.max(routeY(i), splitY(r)) + 26} textAnchor="middle" fontSize={10.5} fill="hsl(var(--muted-foreground))" className="font-mono">
                  {r.on ? POLICY_TEXT(r) : 'route turned off'}
                </text>
              )}
              <circle cx={X_JACK_L} cy={routeY(i)} r={3.5} fill="hsl(var(--foreground))" stroke="hsl(var(--card))" strokeWidth={2} />
            </g>
          )
        })}

        {ORIGINS.map((o) => {
          const y = originY(o.id)
          const isDown = down.has(o.id)
          const r = poolOf(o.id)
          const pct = r && r.pool.length > 1 ? Math.round(share(r, o.id) * 100) : null
          return (
            <g
              key={o.id}
              role="button"
              tabIndex={0}
              aria-label={`${isDown ? 'Restore' : 'Fail'} ${o.label}`}
              aria-pressed={isDown}
              className="group cursor-pointer outline-none [&:focus-visible>rect]:stroke-[hsl(var(--ring))]"
              onClick={() => toggleOrigin(o.id)}
              onKeyDown={onKey(() => toggleOrigin(o.id))}
            >
              <rect
                x={X_JACK_R + 8}
                y={y - 15}
                width={W - X_JACK_R - 10}
                height={30}
                rx={3}
                className="fill-[hsl(var(--card))] stroke-[hsl(var(--border))] transition-colors group-hover:fill-[hsl(var(--accent))] group-hover:stroke-[hsl(var(--destructive))]"
              />
              <circle cx={X_JACK_R} cy={y} r={3.5} fill="hsl(var(--foreground))" stroke="hsl(var(--card))" strokeWidth={2} />
              <circle cx={X_JACK_R + 18} cy={y} r={3.5} fill={isDown ? 'hsl(var(--destructive))' : 'hsl(var(--lamp))'} />
              <text x={X_JACK_R + 30} y={y + 4} fontSize={13} fill={isDown ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'} className="font-mono">
                {o.label}
              </text>
              <text x={W - 10} y={y + 4} textAnchor="end" fontSize={11} className="font-mono">
                <tspan
                  className="group-hover:hidden"
                  fill={isDown ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
                >
                  {isDown ? 'down' : pct != null ? `${pct}%` : ''}
                </tspan>
                <tspan className="hidden group-hover:inline" fill="hsl(var(--muted-foreground))">
                  {isDown ? 'restore' : 'take down'}
                </tspan>
              </text>
            </g>
          )
        })}

        {dots.current.map((d) => {
          const p = dotPos(d)
          const arrived = now >= d.start + d.dur
          return (
            <circle key={d.key} cx={p.x} cy={p.y} r={arrived ? 5 : 4} fill={arrived ? toneFill[d.out.tone] : 'hsl(var(--patch))'} />
          )
        })}
      </svg>

      {/* phones: the same board as a list */}
      <div className="divide-y divide-border/70 sm:hidden">
        {ROUTES.map((r, i) => (
          <button
            key={r.id}
            onClick={() => send(i)}
            className="ledger flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-xs"
          >
            <span className="flex items-center gap-2 text-foreground">
              <span className={cn('lamp', r.on ? 'lamp-on' : 'lamp-off')} />
              {r.label}
            </span>
            <span className="text-muted-foreground">
              {r.on ? `to ${r.pool.map((id) => ORIGINS.find((o) => o.id === id)!.label).join(', ')}` : 'route turned off'}
            </span>
          </button>
        ))}
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {ORIGINS.map((o) => (
            <button
              key={o.id}
              onClick={() => toggleOrigin(o.id)}
              aria-pressed={down.has(o.id)}
              className={cn(
                'ledger flex items-center gap-1.5 rounded border border-border px-2 py-1 text-[11px]',
                down.has(o.id) ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              <span className={cn('lamp', down.has(o.id) ? 'lamp-off' : 'lamp-on')} />
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <Key swatch={<span className="h-0.5 w-4 bg-patch" />}>Carrying a request</Key>
        <Key swatch={<span className="h-0.5 w-4 bg-lamp" />}>Route on, idle</Key>
        <Key swatch={<span className="w-4 border-t border-dashed border-muted-foreground" />}>Route off</Key>
        <Key swatch={<span className="h-2 w-2 rounded-[2px] border border-lamp" />}>A check: auth, rate limit or cache</Key>
      </div>

      <div className="border-t border-border">
        {log.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground">
            Click a path on the left to send it a request. Click an origin on the right to take it down and
            watch its pool re-split. Send /api/search four times quickly to hit its rate limit, or untick the
            JWT box to see auth stop a request.
          </p>
        ) : (
          <ol className="ledger divide-y divide-border/60 text-xs" aria-live="polite">
            {log.map((l) => (
              <li key={l.key} className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] gap-x-3 px-4 py-1.5 sm:grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_11rem]">
                <span
                  className={cn(
                    l.out.tone === 'ok' && 'text-lamp',
                    l.out.tone === 'warn' && 'text-warning',
                    l.out.tone === 'err' && 'text-destructive',
                  )}
                >
                  {l.out.status}
                </span>
                <span className="truncate text-foreground">GET {l.path}</span>
                <span className="text-right text-muted-foreground">{l.out.ms}ms</span>
                <span className="col-span-2 col-start-2 truncate text-muted-foreground sm:col-span-1 sm:col-start-auto">{l.out.where}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function Key({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {swatch}
      {children}
    </span>
  )
}
