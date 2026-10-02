import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { BoardDemo } from '@/components/board-demo'
import { PanelField } from '@/components/panel-field'
import { ConsoleCta } from '@/components/console-cta'

const LIFECYCLE = [
  ['Ingress', 'A request arrives on your subdomain.'],
  ['Match', 'The path is matched against your routes, highest priority first.'],
  ['Auth', 'Open, JWT, API key, or both, chosen per route.'],
  ['Throttle', 'A token bucket decides whether it passes now or waits.'],
  ['Cache', 'A prior response may answer it without touching an origin.'],
  ['Forward', 'Otherwise it goes to a healthy origin, weighted.'],
  ['Log', 'Status, latency, cache and limit outcome land in the request log.'],
]

const CAPABILITIES: { title: string; body: string; detail: string }[] = [
  {
    title: 'Weighted origin pools',
    body: 'Many backends per route, each with a weight. A failed health check pulls an origin and traffic re-splits across the rest.',
    detail: 'weight · health_check_path · interval · timeout · retries',
  },
  {
    title: 'Per-route rate limiting',
    body: 'A token bucket per route: sustained rate plus burst, counted per caller by default (API key or signed-in user, else client IP), so one noisy caller can’t spend everyone’s budget.',
    detail: 'requests_per_second · burst · key strategy',
  },
  {
    title: 'Response cache',
    body: 'Cache a route and successful GETs are held in Redis for your TTL. The hit rate shows on the board.',
    detail: 'cache_enabled · cache_ttl_seconds',
  },
  {
    title: 'Config that applies live',
    body: 'The console writes to the control plane; the gateway picks it up in seconds. No deploy, no restart.',
    detail: 'control plane to gateway, in seconds',
  },
  {
    title: 'Request-log analytics',
    body: 'Every request is logged with status, latency, and cache or limit outcome. Traffic rolls it up: throughput, p95, status mix, busiest paths.',
    detail: 'GET /api/v1/analytics?window=1h|24h|7d|30d',
  },
  {
    title: 'Auth without building it',
    body: 'Clerk JWT for people, scoped API keys for machines. Each route picks which it accepts.',
    detail: 'public · jwt_required · apikey_required · both',
  },
]

const ENDPOINTS = [
  ['GET  /api/v1/tenants/me', 'Your tenant'],
  ['GET  /api/v1/origins', 'List origins'],
  ['POST /api/v1/origins', 'Add an origin'],
  ['GET  /api/v1/routes', 'List routes'],
  ['POST /api/v1/routes', 'Add a route'],
  ['GET  /api/v1/routes/{id}/origins', 'A route’s pool'],
  ['GET  /api/v1/api-keys', 'List keys'],
  ['POST /api/v1/api-keys', 'Generate a key'],
  ['GET  /api/v1/analytics', 'Traffic rollup'],
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-5">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-patch" />
            <span className="font-display text-sm font-semibold tracking-tight">VantageEdge</span>
          </span>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/docs" className="rounded px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Docs
            </Link>
            <SignedOut>
              <Link
                href="/auth/sign-in"
                className="ml-1 inline-flex items-center gap-1.5 rounded bg-patch px-3 py-1.5 font-medium text-primary-foreground"
              >
                Sign in <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="ml-1 inline-flex items-center gap-1.5 rounded bg-patch px-3 py-1.5 font-medium text-primary-foreground"
              >
                Open console <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="ml-2 flex items-center">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{ elements: { avatarBox: 'h-7 w-7 rounded-[3px]' } }}
                />
              </span>
            </SignedIn>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <PanelField className="pointer-events-none absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(58% 78% at 30% 60%, hsl(var(--background) / 0.82), transparent 100%)',
          }}
        />
        <div className="relative mx-auto min-h-[500px] max-w-5xl px-5 pb-24 pt-20 sm:min-h-[560px] sm:pt-28">
          <h1
            className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl"
            style={{ textShadow: '0 2px 22px hsl(var(--background) / 0.85)' }}
          >
            Route, rate-limit and cache your APIs from one console.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            VantageEdge sits in front of your services and sends each incoming path to the backend you chose. Along
            the way it checks auth, holds a rate limit, serves from cache when it can, and writes down
            what happened. You wire it from one console.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ConsoleCta />
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <BoardDemo />
        <p className="mt-2 text-xs text-muted-foreground">
          An example setup, simulated in your browser. Left: paths you expose. Right: the backends behind
          them. Hover a path to see its auth, rate limit and cache settings.
        </p>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">What one request goes through</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The gateway runs these in order, each configured per route. The board above runs the same
            steps: a cache hit never reaches the origin, and an empty bucket stops a request at the limiter.
          </p>

          <div className="mt-8 max-w-3xl">
            <ol className="space-y-0">
              {LIFECYCLE.map(([step, desc], i) => (
                <li key={step} className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border/70 py-3 last:border-0">
                  <span className="ledger w-6 shrink-0 pt-0.5 text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="w-20 shrink-0 font-display text-sm font-semibold">{step}</span>
                  <span className="min-w-0 flex-1 basis-full text-sm text-muted-foreground sm:basis-0">{desc}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight">What it does</h2>
        <dl className="mt-8 border-t border-border">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="grid gap-x-8 gap-y-1 border-b border-border/70 py-4 md:grid-cols-[13rem_1fr_16rem]">
              <dt className="font-display font-semibold">{c.title}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{c.body}</dd>
              <dd className="ledger text-xs text-muted-foreground md:text-right">{c.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Setting one up</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Add an origin', 'Name it, give it a URL and a health check path. This is a backend you already run.'],
              ['Add a route', 'A path pattern like /api/orders/*, the methods it covers, and the origin it points at.'],
              ['Set its policy', 'Optionally: an auth mode, a rate limit, a cache TTL. Defaults are sane; change them inline later.'],
              ['Send traffic', 'Point a hostname at your subdomain, or call the subdomain directly while you test.'],
              ['Watch the board', 'The overview shows which routes reach which origins; Traffic shows throughput, errors, p95 and cache hit rate.'],
              ['Adjust live', 'Change a weight, flip a route off, revoke a key. The gateway applies it without a restart.'],
            ].map(([t, d], i) => (
              <li key={t}>
                <div className="ledger text-xs text-patch">{i + 1}</div>
                <h3 className="mt-1 font-display font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">The API</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Everything the console does is a REST call under <span className="font-mono">/api/v1</span>. Auth is a
              verified Clerk JWT; the tenant is read from the token, never passed in. Machine callers use an
              API key in <span className="font-mono">X-API-Key</span> instead.
            </p>
            <Link
              href="/docs"
              className="mt-4 inline-flex items-center gap-1 text-sm text-patch hover:underline"
            >
              Full reference <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="ledger overflow-hidden rounded border border-border text-xs">
            {ENDPOINTS.map(([ep, desc]) => (
              <div key={ep} className="flex flex-col gap-0.5 border-b border-border/70 px-4 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <code className="overflow-x-auto whitespace-pre text-foreground">{ep}</code>
                <span className="shrink-0 text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Good to know</h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              ['Multi-tenant by design', 'Each account is its own tenant with its own subdomain, origins, routes and keys. Nothing is shared across tenants.'],
              ['The stack', 'Go gateway and control plane, Postgres for config, Redis for the response cache and rate-limit buckets. The console is Next.js.'],
              ['Open source', 'The gateway and control plane are on GitHub. Run the hosted version or your own.'],
              ['Not there yet', 'No cache-entry browser, and analytics is polled rather than streamed. Both are on the list; neither blocks running real traffic.'],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-display font-semibold">{t}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Put something behind it.</h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Add one origin, add one route, and the first request shows up in Traffic.
        </p>
        <div className="mt-6">
          <ConsoleCta />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-patch" />
            VantageEdge
          </span>
          <div className="flex gap-4">
            <Link href="/docs" className="hover:text-foreground">
              Docs
            </Link>
            <a
              href="https://github.com/rakshit-gen/vantageEdge"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <SignedOut>
              <Link href="/auth/sign-in" className="hover:text-foreground">
                Sign in
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="hover:text-foreground">
                Console
              </Link>
            </SignedIn>
          </div>
        </div>
      </footer>
    </div>
  )
}
