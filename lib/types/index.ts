export interface User {
  id: string
  tenant_id: string
  clerk_user_id: string
  email: string
  first_name?: string
  last_name?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  metadata: Record<string, any>
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  name: string
  subdomain: string
  clerk_org_id?: string
  status: 'active' | 'suspended' | 'deleted'
  settings: Record<string, any>
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
  metadata: Record<string, any>
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
  auth_mode: 'public' | 'jwt_required' | 'apikey_required' | 'both'
  is_active: boolean
  
  // Rate limiting
  rate_limit_enabled: boolean
  rate_limit_requests_per_second: number
  rate_limit_burst: number
  rate_limit_key_strategy: string
  
  // Caching
  cache_enabled: boolean
  cache_ttl_seconds: number
  cache_key_pattern: string
  cache_bypass_rules: any
  
  // Transformation
  request_headers: Record<string, string>
  response_headers: Record<string, string>
  path_rewrite_pattern?: string
  path_rewrite_target?: string
  
  // Advanced
  timeout_seconds: number
  retry_attempts: number
  circuit_breaker_enabled: boolean
  circuit_breaker_threshold: number
  
  metadata: Record<string, any>
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
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AnalyticsData {
  total_requests: number
  cache_hit_rate: number
  avg_response_time: number
  error_rate: number
  requests_by_status: Record<string, number>
  requests_over_time: Array<{
    timestamp: string
    count: number
    avg_latency: number
  }>
  top_routes: Array<{
    path: string
    count: number
    avg_latency: number
  }>
  geographic_distribution: Array<{
    country: string
    count: number
  }>
}

export interface CacheEntry {
  key: string
  value: any
  ttl: number
  created_at: string
  expires_at: string
  hit_count: number
}

export interface RequestLog {
  id: string
  tenant_id: string
  route_id?: string
  user_id?: string
  method: string
  path: string
  status_code: number
  response_time_ms: number
  cache_hit: boolean
  created_at: string
}
