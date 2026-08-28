import axios, { AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * The one browser HTTP client. Every control-plane route under /api/v1
 * requires a verified Clerk JWT and derives the tenant from it, so there is
 * no tenant_id to pass. The token comes from Clerk's `getToken`, wired in
 * once by <ApiAuthBridge> (components/providers.tsx). If your Clerk instance
 * needs a JWT template, set NEXT_PUBLIC_CLERK_JWT_TEMPLATE and the bridge
 * passes it to getToken().
 */
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30_000,
})

type TokenGetter = () => Promise<string | null>

let getToken: TokenGetter | null = null
let onUnauthorized: (() => void) | null = null

export function bindAuth(tokenGetter: TokenGetter, unauthorized: () => void) {
  getToken = tokenGetter
  onUnauthorized = unauthorized
}

api.interceptors.request.use(async (config) => {
  const token = getToken ? await getToken() : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: string }>) => {
    const status = error.response?.status
    if (status === 401) onUnauthorized?.()
    const message =
      error.response?.data?.error ||
      (status === 401 ? 'Your session expired. Sign in again.' : error.message) ||
      'Request failed'
    return Promise.reject(new ApiError(message, status))
  },
)
