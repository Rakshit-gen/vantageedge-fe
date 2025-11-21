import { createClientAPI } from '@/lib/api/client-api'

export async function syncUserWithBackend(
  getToken: () => Promise<string | null>,
  clerkUser: {
    id: string
    emailAddresses?: Array<{ emailAddress: string }>
    firstName?: string | null
    lastName?: string | null
  }
) {
  try {
    const token = await getToken()
    if (!token) return null

    const api = createClientAPI(() => Promise.resolve(token))

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''
    if (!email) return null

    const response = await api.post('/auth/sync-user', {
      clerk_user_id: clerkUser.id,
      email,
      first_name: clerkUser.firstName || undefined,
      last_name: clerkUser.lastName || undefined,
    })

    return response.data
  } catch (error) {
    console.error('Failed to sync user:', error)
    return null
  }
}

export async function syncTenantWithBackend(
  getToken: () => Promise<string | null>,
  clerkUserId: string
) {
  try {
    const token = await getToken()
    if (!token) return null

    const api = createClientAPI(() => Promise.resolve(token))

    const response = await api.post('/auth/sync-tenant', {
      clerk_user_id: clerkUserId,
      tenant_name: 'My Workspace',
      clerk_org_id: '',
    })

    return response.data
  } catch (error) {
    console.error('Failed to sync tenant:', error)
    return null
  }
}

export async function getCurrentUserFromBackend(
  getToken: () => Promise<string | null>,
  clerkUserId: string
) {
  try {
    const token = await getToken()
    if (!token) return null

    const api = createClientAPI(() => Promise.resolve(token))
    const response = await api.get('/auth/me?clerk_user_id=' + encodeURIComponent(clerkUserId))
    return response.data
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function getCurrentTenantFromBackend(
  getToken: () => Promise<string | null>,
  clerkUserId: string
) {
  try {
    const token = await getToken()
    if (!token) return null

    const api = createClientAPI(() => Promise.resolve(token))
    const response = await api.get('/auth/tenant?clerk_user_id=' + encodeURIComponent(clerkUserId))
    return response.data
  } catch (error) {
    console.error('Failed to get current tenant:', error)
    return null
  }
}
