'use client'

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'

/** Canonical query keys — one place so invalidation never drifts. */
export const qk = {
  tenant: ['tenant'] as QueryKey,
  origins: ['origins'] as QueryKey,
  routes: ['routes'] as QueryKey,
  apiKeys: ['api-keys'] as QueryKey,
  routePool: (routeId: string) => ['routes', routeId, 'origins'] as QueryKey,
  analytics: (window: string) => ['analytics', window] as QueryKey,
}

interface OptimisticOptions<TVars, TData, TList> {
  mutationFn: (vars: TVars) => Promise<TData>
  /** List cache to patch immediately (and roll back on failure). */
  listKey: QueryKey
  /** Produce the next cached list from the current one. Omit for create/delete-heavy flows that just invalidate. */
  optimistic?: (current: TList | undefined, vars: TVars) => TList | undefined
  /** Extra keys to invalidate once settled (defaults to [listKey]). */
  invalidate?: QueryKey[]
  success?: string | ((data: TData, vars: TVars) => string)
  errorMessage?: string
}

/**
 * useMutation with the three things every mutation in this app wants:
 * optimistic list patch + rollback, a toast on success/failure, and
 * invalidation once settled.
 */
export function useOptimisticMutation<TVars, TData = unknown, TList = unknown>(
  opts: OptimisticOptions<TVars, TData, TList>,
) {
  const qc = useQueryClient()

  return useMutation<TData, unknown, TVars, { prev?: TList }>({
    mutationFn: opts.mutationFn,
    onMutate: async (vars) => {
      if (!opts.optimistic) return {}
      await qc.cancelQueries({ queryKey: opts.listKey })
      const prev = qc.getQueryData<TList>(opts.listKey)
      qc.setQueryData<TList | undefined>(opts.listKey, (cur) => opts.optimistic!(cur, vars))
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(opts.listKey, ctx.prev)
      toast.error(
        opts.errorMessage ?? (err instanceof ApiError ? err.message : 'Something went wrong'),
      )
    },
    onSuccess: (data, vars) => {
      if (opts.success) {
        toast.success(typeof opts.success === 'function' ? opts.success(data, vars) : opts.success)
      }
    },
    onSettled: () => {
      for (const key of opts.invalidate ?? [opts.listKey]) {
        qc.invalidateQueries({ queryKey: key })
      }
    },
  })
}
