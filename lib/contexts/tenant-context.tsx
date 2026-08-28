'use client'

import { createContext, useContext } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import { tenantApi } from '@/lib/api/resources'
import { qk } from '@/lib/hooks/use-resource'
import type { Tenant } from '@/lib/types'

interface TenantContextValue {
  tenant: Tenant | undefined
  isLoading: boolean
  error: Error | null
}

const TenantContext = createContext<TenantContextValue | null>(null)

/**
 * The tenant is resolved by the backend from the Clerk JWT (auto-provisioned
 * on first authenticated request). This just surfaces `GET /tenants/me` —
 * the real tenant UUID, name, subdomain — to the whole dashboard.
 */
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: qk.tenant,
    queryFn: tenantApi.get,
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <TenantContext.Provider value={{ tenant: data, isLoading, error: error as Error | null }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
