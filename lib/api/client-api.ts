import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const createClientAPI = (tenantId: string | null) => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })

  client.interceptors.request.use(
    (config) => {
      // Add tenant_id to query params for GET requests or to body for POST/PUT/DELETE
      if (tenantId) {
        if (config.method === 'get' || config.method === 'GET') {
          config.params = config.params || {}
          config.params.tenant_id = tenantId
        } else {
          // For POST/PUT/DELETE, add to body if it's an object
          if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
            config.data.tenant_id = tenantId
          }
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // No auth redirects - backend is auth-free
      return Promise.reject(error)
    }
  )

  return client
}
