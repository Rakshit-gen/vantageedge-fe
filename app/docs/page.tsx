import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'

export const metadata = {
  title: 'VantageEdge · docs',
  description: 'How the exchange works and how to drive it from the API.',
}

const SECTIONS = [
  ['overview', 'Overview'],
  ['auth', 'Authentication'],
  ['origins', 'Origins'],
  ['routes', 'Routes'],
  ['pool', 'Origin pools'],
  ['keys', 'API keys'],
  ['analytics', 'Analytics'],
  ['auth-modes', 'Auth modes'],
]

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-5">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> VantageEdge
          </Link>
          <Link
            href="/dashboard"
            className="ml-auto rounded bg-patch px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Open console
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Documentation</h1>
        <p className="mt-3 text-muted-foreground">
          The gateway forwards requests; the control plane API configures it. Both are one call away from
          each other, so a change here applies at the edge within seconds.
        </p>

        <nav className="ledger mt-8 flex flex-wrap gap-x-4 gap-y-1 border-y border-border py-3 text-xs">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="text-muted-foreground hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>

        <Section id="overview" title="Overview">
          <p>
            Every request to your subdomain runs through the same pipeline: match a route by path and
            priority, apply its auth mode, spend a rate-limit token, check the response cache, then forward
            to a healthy origin in the route’s pool. The outcome (status, latency, cache hit, limit hit) is
            written to the request log, which is what the Traffic panel reads.
          </p>
          <p>
            The control plane API lives under <Code>/api/v1</Code>. Every route requires a verified Clerk
            JWT. The tenant is resolved from the token; you never pass a tenant id. On your first
            authenticated call, a tenant is provisioned for you automatically.
          </p>
          <CodeBlock
            code={`# base URL
https://<your-control-plane-host>/api/v1

# every request
Authorization: Bearer <clerk session jwt>`}
          />
          <Callout>
            If your Clerk instance needs a JWT template for the backend audience, set{' '}
            <Code>NEXT_PUBLIC_CLERK_JWT_TEMPLATE</Code> and the console mints the token with it.
          </Callout>
        </Section>

        <Section id="auth" title="Authentication">
          <p>
            Two ways in. People use a Clerk session; the browser attaches{' '}
            <Code>Authorization: Bearer &lt;jwt&gt;</Code> automatically. Machines use an API key in the{' '}
            <Code>X-API-Key</Code> header, issued from the Keys panel with the scopes it needs.
          </p>
          <CodeBlock
            code={`# session (what the console sends)
curl https://<host>/api/v1/routes \\
  -H "Authorization: Bearer $CLERK_JWT"

# machine caller
curl https://<host>/api/v1/routes \\
  -H "X-API-Key: ve_live_..."`}
          />
        </Section>

        <Section id="origins" title="Origins">
          <p>An origin is a backend the gateway can forward to. Health checks run on the interval you set; a failing origin is taken out of rotation until it passes again.</p>
          <EndpointList
            rows={[
              ['GET', '/origins', 'List origins'],
              ['POST', '/origins', 'Create an origin'],
              ['GET', '/origins/{id}', 'Fetch one'],
              ['PATCH', '/origins/{id}', 'Update fields'],
              ['DELETE', '/origins/{id}', 'Remove'],
            ]}
          />
          <CodeBlock
            code={`curl -X POST https://<host>/api/v1/origins \\
  -H "Authorization: Bearer $CLERK_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "orders-api",
    "url": "https://orders.internal.example.com",
    "health_check_path": "/health",
    "health_check_interval": 30,
    "timeout_seconds": 5,
    "max_retries": 3,
    "weight": 1
  }'`}
          />
        </Section>

        <Section id="routes" title="Routes">
          <p>
            A route binds a path pattern to an origin and carries its policy: methods, priority, auth mode,
            rate limit, cache. Higher <Code>priority</Code> wins when patterns overlap.
          </p>
          <EndpointList
            rows={[
              ['GET', '/routes', 'List routes'],
              ['POST', '/routes', 'Create a route'],
              ['GET', '/routes/{id}', 'Fetch one'],
              ['PATCH', '/routes/{id}', 'Update fields'],
              ['DELETE', '/routes/{id}', 'Remove'],
            ]}
          />
          <CodeBlock
            code={`curl -X POST https://<host>/api/v1/routes \\
  -H "Authorization: Bearer $CLERK_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin_id": "<origin uuid>",
    "name": "orders",
    "path_pattern": "/api/orders/*",
    "methods": ["GET", "POST"],
    "priority": 10,
    "auth_mode": "jwt_required",
    "is_active": true,
    "rate_limit_enabled": true,
    "rate_limit_requests_per_second": 50,
    "rate_limit_burst": 20,
    "cache_enabled": false
  }'`}
          />
        </Section>

        <Section id="pool" title="Origin pools">
          <p>
            Beyond its primary origin, a route can load-balance across a pool. Members are weighted and
            health-checked like any origin.
          </p>
          <EndpointList
            rows={[
              ['GET', '/routes/{id}/origins', 'List the pool'],
              ['POST', '/routes/{id}/origins/{origin_id}', 'Add to the pool'],
              ['DELETE', '/routes/{id}/origins/{origin_id}', 'Remove from the pool'],
            ]}
          />
        </Section>

        <Section id="keys" title="API keys">
          <p>
            Keys authenticate machine callers. The secret is returned once, on creation. Scopes are{' '}
            <Code>read</Code>, <Code>write</Code>, <Code>admin</Code>; expiry is optional.
          </p>
          <EndpointList
            rows={[
              ['GET', '/api-keys', 'List keys'],
              ['POST', '/api-keys', 'Generate a key'],
              ['DELETE', '/api-keys/{id}', 'Revoke'],
            ]}
          />
          <CodeBlock
            code={`curl -X POST https://<host>/api/v1/api-keys \\
  -H "Authorization: Bearer $CLERK_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "ci-deploy", "scopes": ["read","write"], "expires_at": "2026-12-31T23:59:59Z" }'
# -> { ..., "key": "ve_live_xxx" }   (shown once)`}
          />
        </Section>

        <Section id="analytics" title="Analytics">
          <p>
            A rollup of the request log for a time window. Buckets are hourly for <Code>1h</Code> and{' '}
            <Code>24h</Code>, daily beyond that.
          </p>
          <EndpointList rows={[['GET', '/analytics?window=1h|24h|7d|30d', 'Traffic rollup']]} />
          <CodeBlock
            code={`curl "https://<host>/api/v1/analytics?window=24h" \\
  -H "Authorization: Bearer $CLERK_JWT"

{
  "window": "24h",
  "generated_at": "2026-08-29T12:00:00Z",
  "totals": {
    "total_requests": 48210,
    "error_rate": 0.012,
    "cache_hit_rate": 0.41,
    "rate_limited_count": 88,
    "avg_latency_ms": 37.4,
    "p95_latency_ms": 121.0
  },
  "series": [ { "ts": "...", "count": 2010, "avg_latency_ms": 35.1, "error_count": 12 } ],
  "status_breakdown": { "200": 46110, "404": 900, "500": 210 },
  "top_routes": [ { "path": "/api/orders/*", "count": 12005, "avg_latency_ms": 41.2, "error_count": 30 } ]
}`}
          />
        </Section>

        <Section id="auth-modes" title="Auth modes">
          <p>Set per route, in <Code>auth_mode</Code>:</p>
          <EndpointList
            rows={[
              ['public', '', 'No authentication. Anyone can call it.'],
              ['jwt_required', '', 'A valid Clerk JWT must be present.'],
              ['apikey_required', '', 'A valid X-API-Key must be present.'],
              ['both', '', 'JWT and API key both required.'],
            ]}
          />
        </Section>

        <div className="mt-16 border-t border-border pt-8">
          <Link href="/dashboard" className="text-sm text-patch hover:underline">
            Open the console →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-10 first-of-type:border-0">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground [&_p]:text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-[3px] bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border-l-2 border-patch bg-card/60 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function EndpointList({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="ledger overflow-hidden rounded border border-border text-xs">
      {rows.map(([verb, path, desc], i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border/70 px-3 py-2 last:border-0">
          <span className="w-16 shrink-0 uppercase text-patch">{verb}</span>
          {path && <code className="shrink-0 text-foreground">{path}</code>}
          <span className="text-muted-foreground">{desc}</span>
        </div>
      ))}
    </div>
  )
}
