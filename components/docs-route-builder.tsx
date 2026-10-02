'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { DocsCode } from './docs-config'

/**
 * Fill in a route and get the POST /routes call for it, plus a plain reading
 * of what the gateway will do with that config. Defaults and fallbacks follow
 * the gateway: rps or burst left at 0 use the server defaults (100/s, burst
 * 200), an empty method list allows every method.
 */

const VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
const AUTH = {
  public: 'Anyone can call it.',
  jwt_required: 'Callers need a valid Clerk JWT.',
  apikey_required: 'Callers need a valid API key in X-API-Key.',
  both: 'Callers need a Clerk JWT and an API key.',
} as const
const KEYS = {
  tenant_user: 'each caller (API key or signed-in user, else client IP)',
  ip: 'each client IP',
  tenant: 'your whole tenant, shared by every caller',
} as const
const LB = {
  weighted: 'picked at random by origin weight',
  round_robin: 'taken in turn',
  least_conn: 'sent to the origin with the fewest requests in flight',
  ip_hash: 'pinned to one origin per client IP',
} as const

export function RouteBuilder() {
  const [name, setName] = useState('orders')
  const [pattern, setPattern] = useState('/api/orders/*')
  const [methods, setMethods] = useState<string[]>(['GET', 'POST'])
  const [priority, setPriority] = useState(10)
  const [auth, setAuth] = useState<keyof typeof AUTH>('jwt_required')
  const [lb, setLb] = useState<keyof typeof LB>('weighted')
  const [rl, setRl] = useState(true)
  const [rps, setRps] = useState(50)
  const [burst, setBurst] = useState(20)
  const [keyBy, setKeyBy] = useState<keyof typeof KEYS>('tenant_user')
  const [cache, setCache] = useState(false)
  const [ttl, setTtl] = useState(60)

  const body: Record<string, unknown> = {
    origin_id: '<origin uuid>',
    name,
    path_pattern: pattern,
    methods,
    priority,
    auth_mode: auth,
    load_balancing: lb,
    is_active: true,
    rate_limit_enabled: rl,
    ...(rl && { rate_limit_requests_per_second: rps, rate_limit_burst: burst, rate_limit_key_strategy: keyBy }),
    cache_enabled: cache,
    ...(cache && { cache_ttl_seconds: ttl }),
  }
  const json = JSON.stringify(body, null, 2)
  const curl = `curl -X POST https://<host>/api/v1/routes \\
  -H "Authorization: Bearer $CLERK_JWT" \\
  -H "Content-Type: application/json" \\
  -d '${json.replace(/\n/g, '\n  ')}'`
  const js = `await fetch("https://<host>/api/v1/routes", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${clerkJwt}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${json.replace(/\n/g, '\n  ')}),
})`

  const effRps = rps > 0 ? rps : 100
  const effBurst = burst > 0 ? burst : 200
  const problems = [
    !pattern.startsWith('/') && !pattern.startsWith('*') && 'Request paths start with /, so this pattern can never match.',
    !name.trim() && 'Give the route a name.',
    cache && ttl < 1 && 'Set a cache TTL of at least 1 second.',
  ].filter(Boolean) as string[]

  const reading = [
    `${methods.length ? methods.join(', ') : 'Every method'} on ${pattern || '(no pattern)'}${pattern.includes('*') ? ', where * matches anything including slashes,' : ''} goes to the route's origin pool, ${LB[lb]}.`,
    AUTH[auth],
    rl
      ? `Rate limit per ${KEYS[keyBy]}: up to ${effBurst} requests at once, refilling at ${effRps} per second. Past that the gateway answers 429 with a Retry-After header.${rps <= 0 || burst <= 0 ? ' A 0 here means the server default.' : ''}`
      : 'No rate limit.',
    cache
      ? `Successful (200) GET responses are cached for ${ttl}s, separately for each caller. Responses that set a cookie or send Cache-Control no-store, no-cache or private are not cached.`
      : 'Nothing is cached.',
  ]

  const field = 'ledger w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:border-patch focus:outline-none'
  const label = 'mb-1 block text-xs text-muted-foreground'

  return (
    <div className="not-prose space-y-3">
      <div className="grid gap-3 rounded border border-border bg-card p-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="rb-name">Name</label>
          <input id="rb-name" className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="rb-pattern">Path pattern</label>
          <input id="rb-pattern" className={field} value={pattern} spellCheck={false} onChange={(e) => setPattern(e.target.value.trim())} />
        </div>
        <fieldset>
          <legend className={label}>Methods (none ticked means all)</legend>
          <div className="flex flex-wrap gap-1">
            {VERBS.map((v) => {
              const on = methods.includes(v)
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMethods((m) => (on ? m.filter((x) => x !== v) : VERBS.filter((x) => x === v || m.includes(x))))}
                  className={cn(
                    'ledger rounded border px-2 py-0.5 text-[11px]',
                    on ? 'border-patch bg-patch/10 text-patch' : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </fieldset>
        <div>
          <label className={label} htmlFor="rb-priority">Priority (higher is tried first)</label>
          <input id="rb-priority" type="number" className={field} value={priority} onChange={(e) => setPriority(Number(e.target.value) || 0)} />
        </div>
        <div>
          <label className={label} htmlFor="rb-auth">Auth mode</label>
          <select id="rb-auth" className={field} value={auth} onChange={(e) => setAuth(e.target.value as keyof typeof AUTH)}>
            {Object.keys(AUTH).map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="rb-lb">Load balancing</label>
          <select id="rb-lb" className={field} value={lb} onChange={(e) => setLb(e.target.value as keyof typeof LB)}>
            {Object.keys(LB).map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" checked={rl} onChange={(e) => setRl(e.target.checked)} className="accent-[hsl(var(--patch))]" />
            Rate limit
          </label>
          {rl && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={label} htmlFor="rb-rps">Requests per second</label>
                <input id="rb-rps" type="number" min={0} className={field} value={rps} onChange={(e) => setRps(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div>
                <label className={label} htmlFor="rb-burst">Burst</label>
                <input id="rb-burst" type="number" min={0} className={field} value={burst} onChange={(e) => setBurst(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div>
                <label className={label} htmlFor="rb-key">Counted per</label>
                <select id="rb-key" className={field} value={keyBy} onChange={(e) => setKeyBy(e.target.value as keyof typeof KEYS)}>
                  {Object.keys(KEYS).map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" checked={cache} onChange={(e) => setCache(e.target.checked)} className="accent-[hsl(var(--patch))]" />
            Cache responses
          </label>
          {cache && (
            <div className="sm:w-1/3">
              <label className={label} htmlFor="rb-ttl">TTL in seconds</label>
              <input id="rb-ttl" type="number" min={1} className={field} value={ttl} onChange={(e) => setTtl(Math.max(0, Number(e.target.value) || 0))} />
            </div>
          )}
        </div>
      </div>

      <div className="rounded border border-border px-4 py-3 text-xs leading-relaxed" aria-live="polite">
        <p className="mb-1 font-medium text-foreground">What this route does</p>
        <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
          {reading.map((r) => <li key={r}>{r}</li>)}
        </ul>
        {problems.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-warning">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
      </div>

      <DocsCode code={curl} js={js} />
    </div>
  )
}
