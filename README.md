# VantageEdge console

The operator console for the [VantageEdge](https://github.com/rakshit-gen/vantageEdge)
API gateway. You add origins, patch routes to them, set each route's policy
(auth mode, rate limit, cache TTL), and watch traffic cross the board.

Design direction is **the exchange**: the gateway as a telephone switchboard.
The signature element is a patchboard diagram (routes on the left, origins on
the right, a cable per route). Warm ink-on-paper palette, one patch-cord accent,
Bricolage Grotesque + Spline Sans.

## Running it

```bash
npm install
cp .env.example .env.local   # add your Clerk keys + the API URL
npm run dev                   # http://localhost:3000
```

`npm run type-check` and `npm run build` should both pass clean.

## Auth

Auth is a Clerk session. There is **no sync step**: the browser attaches the
Clerk JWT as `Authorization: Bearer <jwt>` on every `/api/v1` call, the
control plane verifies it and resolves the tenant from the token, and a tenant
is provisioned on the first authenticated request. A client never passes a
`tenant_id`.

If your Clerk instance needs a JWT template for the backend audience, set
`NEXT_PUBLIC_CLERK_JWT_TEMPLATE`; `components/providers.tsx` passes it to
`getToken()`. Machine callers use an API key in `X-API-Key` instead.

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page, with an interactive request simulator |
| `/docs` | API reference |
| `/dashboard` | The board: patchboard + traffic rollup |
| `/dashboard/services` | Origins (dense table, inline edit, health) |
| `/dashboard/routes` | Routes as signal paths, origin-pool editor in the drawer |
| `/dashboard/api-keys` | Generate / revoke keys, one-time reveal |
| `/dashboard/analytics` | Traffic: throughput, latency, status mix, cache, top routes |
| `/dashboard/settings` | Tenant identity, delete-tenant danger zone |

`⌘K` opens the command palette anywhere in the dashboard.

## API surface it talks to

All under `/api/v1`, Clerk JWT, tenant from context:

```
GET|PUT|DELETE  /tenants/me
GET|POST        /origins
GET|PATCH|DELETE /origins/{id}
GET|POST        /routes
GET|PATCH|DELETE /routes/{id}
GET|POST|DELETE /routes/{id}/origins/{origin_id}
GET|POST        /api-keys
DELETE          /api-keys/{id}
GET             /analytics?window=1h|24h|7d|30d
```

## Stack

Next.js 14 (App Router), TypeScript, Tailwind, Radix / shadcn primitives,
TanStack Query, Clerk, Recharts, cmdk, vaul, sonner.

## Not there yet

- No cache-entry browser (the gateway has no inspection API for it). Route
  cache policy still lives on the route editor.
- Analytics is polled (20s), not streamed.
