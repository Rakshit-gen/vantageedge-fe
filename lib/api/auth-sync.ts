'use client'

import { createClientAPI } from './client-api'
import { useAuth } from '@clerk/nextjs'

export interface UserSyncData {
  clerk_user_id: string
  email: string
  first_name?: string
  last_name?: string
  clerk_org_id?: string
}

export interface TenantSyncData {
  clerk_org_id: string
  name: string
  subdomain: string
}

// Create a client-side API client factory
export function createAuthSyncService(getToken: () => Promise<string | null>) {
  const apiClient = createClientAPI(getToken)

  return {
    // Sync user with backend
    async syncUser(userData: UserSyncData) {
      try {
        const response = await apiClient.post('/auth/sync-user', userData)
        return response.data
      } catch (error) {
        console.error('Failed to sync user:', error)
        throw error
      }
    },

    // Sync tenant/organization with backend
    async syncTenant(tenantData: TenantSyncData) {
      try {
        const response = await apiClient.post('/auth/sync-tenant', tenantData)
        return response.data
      } catch (error) {
        console.error('Failed to sync tenant:', error)
        throw error
      }
    },

    // Get current user from backend
    async getCurrentUser() {
      try {
        const response = await apiClient.get('/auth/me')
        return response.data
      } catch (error) {
        console.error('Failed to get current user:', error)
        return null
      }
    },

    // Get user's tenant
    async getCurrentTenant() {
      try {
        const response = await apiClient.get('/auth/tenant')
        return response.data
      } catch (error) {
        console.error('Failed to get tenant:', error)
        return null
      }
    },
  }
}

// Hook to use auth sync service in client components
export function useAuthSyncService() {
  const { getToken } = useAuth()
  return createAuthSyncService(getToken)
}
