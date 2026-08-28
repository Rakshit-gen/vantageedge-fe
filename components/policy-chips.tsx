'use client'

import { Badge } from '@/components/ui/badge'
import { formatCompact } from '@/lib/utils'
import type { Route } from '@/lib/types'

const AUTH_LABEL: Record<Route['auth_mode'], string> = {
  public: 'open',
  jwt_required: 'jwt',
  apikey_required: 'key',
  both: 'jwt + key',
}

/**
 * The policy stamps on a route: how it's guarded, whether it's throttled,
 * whether responses are held, whether the breaker is armed. Read in order,
 * they're the route's rulebook in one line.
 */
export function PolicyChips({ route, className }: { route: Route; className?: string }) {
  return (
    <div className={className}>
      <Badge variant={route.auth_mode === 'public' ? 'outline' : 'lamp'}>
        {AUTH_LABEL[route.auth_mode]}
      </Badge>

      {route.rate_limit_enabled ? (
        <Badge variant="patch">
          {formatCompact(route.rate_limit_requests_per_second)}/s
          {route.rate_limit_burst ? ` ·${formatCompact(route.rate_limit_burst)}` : ''}
        </Badge>
      ) : null}

      {route.cache_enabled ? <Badge variant="lamp">cache {route.cache_ttl_seconds}s</Badge> : null}

      {route.circuit_breaker_enabled ? (
        <Badge variant="warning">breaker {route.circuit_breaker_threshold}</Badge>
      ) : null}

      {route.retry_attempts > 0 ? <Badge variant="outline">retry ×{route.retry_attempts}</Badge> : null}
    </div>
  )
}
