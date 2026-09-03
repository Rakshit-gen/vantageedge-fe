import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DocsConfig, HostBar, DocsCode } from '@/components/docs-config'
import { DocsNav } from '@/components/docs-nav'
import { RequestSim } from '@/components/request-sim'
import { Endpoints } from '@/components/docs-endpoints'

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
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-5">
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

      <div className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Documentation</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The gateway forwards requests; the control plane API configures it. Both are one call away from
          each other, so a change here applies at the edge within seconds.
        </p>

        <DocsConfig>
        <div className="mt-10">
        <HostBar />
        <div className="lg:grid lg:grid-cols-[150px_1fr] lg:gap-12">
          <div className="sticky top-14 z-20 -mx-5 border-y border-border bg-background/90 px-5 py-3 backdrop-blur lg:top-20 lg:mx-0 lg:self-start lg:border-0 lg:bg-transparent lg:p-0">
            <DocsNav sections={SECTIONS} />
          </div>

          <div className="min-w-0">
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
          <DocsCode
            code={`# base URL
https://<your-control-plane-host>/api/v1

# every request
Authorization: Bearer <clerk session jwt>`}
          />
          <Callout>
            If your Clerk instance needs a JWT template for the backend audience, set{' '}
            <Code>NEXT_PUBLIC_CLERK_JWT_TEMPLATE</Code> and the console mints the token with it.
          </Callout>
          <div className="not-prose pt-2">
            <p className="mb-2 text-xs text-muted-foreground">
              Send a few requests through the pipeline. Toggle the cache and auth to see where each one stops.
            </p>
            <RequestSim />
          </div>
        </Section>

        <Section id="auth" title="Authentication">
          <p>
            Two ways in. People use a Clerk session; the browser attaches{' '}
            <Code>Authorization: Bearer &lt;jwt&gt;</Code> automatically. Machines use an API key in the{' '}
            <Code>X-API-Key</Code> header, issued from the Keys panel with the scopes it needs.
          </p>
          <DocsCode
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
          <Endpoints
            rows={[
              { verb: 'GET', path: '/origins', desc: 'List origins', note: 'Every origin for your tenant, newest first.' },
              { verb: 'POST', path: '/origins', desc: 'Create an origin', note: 'url is required and must be absolute. Health checks start immediately; the origin is unhealthy until the first probe passes.' },
              { verb: 'GET', path: '/origins/{id}', desc: 'Fetch one', note: '404 if the id belongs to another tenant.' },
              { verb: 'PATCH', path: '/origins/{id}', desc: 'Update fields', note: 'Partial update: only the fields you send change. A new interval is picked up on the next health-check cycle.' },
              { verb: 'DELETE', path: '/origins/{id}', desc: 'Remove', note: 'Fails while the origin is still a member of any route pool. Remove it from the pools first.' },
            ]}
          />
          <DocsCode
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
          <Endpoints
            rows={[
              { verb: 'GET', path: '/routes', desc: 'List routes', note: 'Ordered by priority, highest first, which is also the order they are matched in.' },
              { verb: 'POST', path: '/routes', desc: 'Create a route', note: 'origin_id is required and must be one of your origins. path_pattern takes a trailing /* wildcard.' },
              { verb: 'GET', path: '/routes/{id}', desc: 'Fetch one', note: 'Includes the resolved pool members.' },
              { verb: 'PATCH', path: '/routes/{id}', desc: 'Update fields', note: 'Partial update. Toggling is_active takes effect at the edge within seconds.' },
              { verb: 'DELETE', path: '/routes/{id}', desc: 'Remove', note: 'Drops the route and its pool bindings. The origins themselves are left alone.' },
            ]}
          />
          <DocsCode
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
    "load_balancing": "round_robin",
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
            Beyond its primary origin, a route can load-balance across a pool. Members are
            health-checked like any origin. The route’s <Code>load_balancing</Code> picks how a request
            is assigned: <Code>weighted</Code> (default, random by origin weight), <Code>round_robin</Code>,
            <Code>least_conn</Code> (fewest in-flight requests), or <Code>ip_hash</Code> (a client IP
            sticks to one origin).
          </p>
          <Endpoints
            rows={[
              { verb: 'GET', path: '/routes/{id}/origins', desc: 'List the pool', note: "The route's load-balancing pool, including its primary origin." },
              { verb: 'POST', path: '/routes/{id}/origins/{origin_id}', desc: 'Add to the pool', note: 'Adds an existing origin. Its weight comes from the origin record; change it there.' },
              { verb: 'DELETE', path: '/routes/{id}/origins/{origin_id}', desc: 'Remove from the pool', note: "You cannot remove the route's primary origin this way; repoint the route instead." },
            ]}
          />
        </Section>

        <Section id="keys" title="API keys">
          <p>
            Keys authenticate machine callers. The secret is returned once, on creation. Scopes are{' '}
            <Code>read</Code>, <Code>write</Code>, <Code>admin</Code>; expiry is optional.
          </p>
          <Endpoints
            rows={[
              { verb: 'GET', path: '/api-keys', desc: 'List keys', note: 'Metadata only, never the secret: key_prefix, scopes, usage_count, last_used_at, expires_at.' },
              { verb: 'POST', path: '/api-keys', desc: 'Generate a key', note: 'The full key is in the response once and is never retrievable again. Store it now.' },
              { verb: 'DELETE', path: '/api-keys/{id}', desc: 'Revoke', note: 'Immediate. In-flight requests using the key finish; the next one gets 401.' },
            ]}
          />
          <DocsCode
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
          <Endpoints
            rows={[
              {
                verb: 'GET',
                path: '/analytics?window=1h|24h|7d|30d',
                desc: 'Traffic rollup',
                note: 'window is one of 1h, 24h, 7d, 30d; anything else is a 400. Buckets are hourly up to 24h, daily beyond. Reads straight from the request log, so it reflects the last few seconds.',
              },
            ]}
          />
          <DocsCode
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
          <dl className="ledger overflow-hidden rounded border border-border text-xs">
            {[
              ['public', 'No authentication. Anyone can call it.'],
              ['jwt_required', 'A valid Clerk JWT must be present.'],
              ['apikey_required', 'A valid X-API-Key must be present.'],
              ['both', 'Both a JWT and an X-API-Key must be present.'],
            ].map(([mode, desc]) => (
              <div
                key={mode}
                className="flex flex-col gap-0.5 border-b border-border/70 px-3 py-2 last:border-0 sm:flex-row sm:gap-4"
              >
                <dt className="shrink-0 text-patch sm:w-36">{mode}</dt>
                <dd className="text-muted-foreground">{desc}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <div className="mt-16 border-t border-border pt-8">
          <Link href="/dashboard" className="text-sm text-patch hover:underline">
            Open the console →
          </Link>
        </div>
          </div>
        </div>
        </div>
        </DocsConfig>
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

