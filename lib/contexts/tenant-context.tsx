'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization, useUser } from '@clerk/nextjs'

interface TenantContextType {
  tenantId: string | null
  loading: boolean
  error: string | null
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  loading: true,
  error: null,
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { organization } = useOrganization()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getTenantId = () => {
      setLoading(true)
      try {
        // Use Clerk organization ID as tenant ID, or user ID as fallback
        // In production, you might want to map this to your backend tenant IDs
        if (organization?.id) {
          setTenantId(organization.id)
        } else if (user?.id) {
          // Fallback to user ID if no organization
          setTenantId(user.id)
        } else {
          setError('No user or organization found')
        }
      } catch (err) {
        console.error('Error getting tenant ID:', err)
        setError('Failed to get tenant information')
      } finally {
        setLoading(false)
      }
    }

    if (user || organization) {
      getTenantId()
    } else {
      setLoading(false)
    }
  }, [user, organization])

  return (
    <TenantContext.Provider value={{ tenantId, loading, error }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}
