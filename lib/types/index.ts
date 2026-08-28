// Wire types — these mirror the Go models the control-plane returns
// (internal/models/models.go) and the analytics payload
// (internal/controlplane/service/analytics.go). snake_case on purpose.

export type Role = 'owner' | 'admin' | 'member' | 'viewer'
export type AuthMode = 'public' | 'jwt_required' | 'apikey_required' | 'both'

export interface Tenant {
  id: string
  name: string
  subdomain: string
  clerk_org_id?: string
  status: 'active' | 'suspended' | 'deleted'
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  tenant_id: string
  clerk_user_id: string
  email: string
  first_name?: string
  last_name?: string
  role: Role
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export interface Origin {
  id: string
  tenant_id: string
  name: string
  url: string
  health_check_path: string
  health_check_interval: number
  timeout_seconds: number
  max_retries: number
  weight: number
  is_healthy: boolean
  last_health_check?: string
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  tenant_id: string
  origin_id: string
  name: string
  path_pattern: string
  methods: string[]
  priority: number
  auth_mode: AuthMode
  is_active: boolean

  rate_limit_enabled: boolean
  rate_limit_requests_per_second: number
  rate_limit_burst: number
  rate_limit_key_strategy: string

  cache_enabled: boolean
  cache_ttl_seconds: number
  cache_key_pattern: string

  timeout_seconds: number
  retry_attempts: number
  circuit_breaker_enabled: boolean
  circuit_breaker_threshold: number

  created_at: string
  updated_at: string
}

export interface APIKey {
  id: string
  tenant_id: string
  user_id?: string
  name: string
  key_prefix: string
  scopes: string[]
  rate_limit_override?: number
  expires_at?: string
  last_used_at?: string
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Returned once, on creation, alongside the persisted key. */
export interface APIKeyWithSecret extends APIKey {
  key: string
}

// --- Analytics (GET /api/v1/analytics) ---

export type AnalyticsWindow = '1h' | '24h' | '7d' | '30d'

export interface TimeBucket {
  ts: string
  count: number
  avg_latency_ms: number
  error_count: number
}

export interface RouteStat {
  path: string
  count: number
  avg_latency_ms: number
  error_count: number
}

export interface Analytics {
  window: string
  generated_at: string
  totals: {
    total_requests: number
    error_rate: number
    cache_hit_rate: number
    rate_limited_count: number
    avg_latency_ms: number
    p95_latency_ms: number
  }
  series: TimeBucket[]
  status_breakdown: Record<string, number>
  top_routes: RouteStat[]
}
