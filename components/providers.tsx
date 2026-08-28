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
    bindAuth(
      () => (template ? getToken({ template }) : getToken()),
      () => {
        signOut(() => router.push('/auth/sign-in'))
      },
    )
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
