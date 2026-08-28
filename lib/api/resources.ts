import { api } from './client'
import type {
  Analytics,
  AnalyticsWindow,
  APIKey,
  APIKeyWithSecret,
  AuthMode,
  Origin,
  Route,
  Tenant,
} from '@/lib/types'

// Thin per-resource wrappers over the one authenticated client. No logic
// beyond URL + verb + "return the body" — the control-plane returns bare
// arrays and objects. These are the fns pages hand to react-query.

export interface OriginInput {
  name: string
  url: string
  health_check_path?: string
  health_check_interval?: number
  timeout_seconds?: number
  max_retries?: number
  weight?: number
}

export interface RouteInput {
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
}

export const tenantApi = {
  get: () => api.get<Tenant>('/tenants/me').then((r) => r.data),
  // The control-plane only persists name/status/settings on a tenant.
  update: (body: { name?: string; status?: string; settings?: Record<string, unknown> }) =>
    api.put<Tenant>('/tenants/me', body).then((r) => r.data),
  remove: () => api.delete('/tenants/me').then(() => undefined),
}

export const originsApi = {
  list: () => api.get<Origin[]>('/origins').then((r) => r.data ?? []),
  get: (id: string) => api.get<Origin>(`/origins/${id}`).then((r) => r.data),
  create: (body: OriginInput) => api.post<Origin>('/origins', body).then((r) => r.data),
  update: (id: string, body: Partial<OriginInput>) =>
    api.patch<Origin>(`/origins/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/origins/${id}`).then(() => undefined),
}

export const routesApi = {
  list: () => api.get<Route[]>('/routes').then((r) => r.data ?? []),
  get: (id: string) => api.get<Route>(`/routes/${id}`).then((r) => r.data),
  create: (body: RouteInput) => api.post<Route>('/routes', body).then((r) => r.data),
  update: (id: string, body: Partial<RouteInput>) =>
    api.patch<Route>(`/routes/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/routes/${id}`).then(() => undefined),
  pool: {
    list: (routeId: string) =>
      api.get<Origin[]>(`/routes/${routeId}/origins`).then((r) => r.data ?? []),
    add: (routeId: string, originId: string) =>
      api.post(`/routes/${routeId}/origins/${originId}`).then(() => undefined),
    remove: (routeId: string, originId: string) =>
      api.delete(`/routes/${routeId}/origins/${originId}`).then(() => undefined),
  },
}

export const apiKeysApi = {
  list: () => api.get<APIKey[]>('/api-keys').then((r) => r.data ?? []),
  create: (body: { name: string; scopes: string[]; expires_at?: string }) =>
    api.post<APIKeyWithSecret>('/api-keys', body).then((r) => r.data),
  remove: (id: string) => api.delete(`/api-keys/${id}`).then(() => undefined),
}

export const analyticsApi = {
  get: (window: AnalyticsWindow) =>
    api.get<Analytics>('/analytics', { params: { window } }).then((r) => r.data),
}
