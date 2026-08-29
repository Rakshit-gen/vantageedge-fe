'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { bindAuth } from '@/lib/api/client'
import { TenantProvider } from '@/lib/contexts/tenant-context'
import { ApiError } from '@/lib/api/client'

/** Feeds the Clerk token getter + a 401 handler into the shared HTTP client. */
function ApiAuthBridge() {
  const { getToken, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const template = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE
    const fetchToken = async () => {
      try {
        return template ? await getToken({ template }) : await getToken()
      } catch {
        // A missing or misconfigured JWT template must not wedge every
        // request — fall back to Clerk's default session token.
        return getToken()
      }
    }
    bindAuth(fetchToken, () => {
      // A lone API 401 is usually a backend hiccup (Render cold start,
      // clock skew, a token that expired mid-flight), not a dead session.
      // Only sign out if Clerk itself no longer has one.
      fetchToken().then((token) => {
        if (!token) signOut(() => router.push('/auth/sign-in'))
      })
    })
  }, [getToken, signOut, router])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Don't hammer the API on a stale/expired token.
            retry: (count, err) => !(err instanceof ApiError && err.status === 401) && count < 2,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <ApiAuthBridge />
        <TenantProvider>{children}</TenantProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
