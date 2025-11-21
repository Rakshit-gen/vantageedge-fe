'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientAPI } from '@/lib/api/client-api'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Route, Origin } from '@/lib/types'
import { toast } from 'sonner'

interface AddRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: Route | null
  onSuccess?: () => void
}

export function AddRouteDialog({
  open,
  onOpenChange,
  route,
  onSuccess,
}: AddRouteDialogProps) {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    origin_id: '',
    path_pattern: '',
    methods: ['GET'] as string[],
    priority: 0,
    auth_mode: 'public' as 'public' | 'jwt_required' | 'apikey_required' | 'both',
    is_active: true,
    rate_limit_enabled: false,
    rate_limit_requests_per_second: 100,
    cache_enabled: false,
    cache_ttl_seconds: 60,
  })

  // Fetch origins for dropdown
  const { data: origins } = useQuery({
    queryKey: ['origins', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      const response = await api.get(`/origins/tenant/${tenantId}`)
      const data = response.data
      if (Array.isArray(data)) {
        return data as Origin[]
      }
      if (data && Array.isArray(data.data)) {
        return data.data as Origin[]
      }
      if (data && Array.isArray(data.origins)) {
        return data.origins as Origin[]
      }
      return [] as Origin[]
    },
    enabled: !!tenantId,
  })

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        origin_id: route.origin_id,
        path_pattern: route.path_pattern,
        methods: route.methods,
        priority: route.priority,
        auth_mode: route.auth_mode,
        is_active: route.is_active,
        rate_limit_enabled: route.rate_limit_enabled,
        rate_limit_requests_per_second: route.rate_limit_requests_per_second,
        cache_enabled: route.cache_enabled,
        cache_ttl_seconds: route.cache_ttl_seconds,
      })
    } else {
      setFormData({
        name: '',
        origin_id: origins?.[0]?.id || '',
        path_pattern: '',
        methods: ['GET'],
        priority: 0,
        auth_mode: 'public',
        is_active: true,
        rate_limit_enabled: false,
        rate_limit_requests_per_second: 100,
        cache_enabled: false,
        cache_ttl_seconds: 60,
      })
    }
  }, [route, open, origins])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      if (route) {
        await api.patch(`/routes/${route.id}`, data)
      } else {
        await api.post('/routes', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', tenantId] })
      toast.success(route ? 'Route updated successfully' : 'Route created successfully')
      onOpenChange(false)
      onSuccess?.()
    },
    onError: () => {
      toast.error(route ? 'Failed to update route' : 'Failed to create route')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const toggleMethod = (method: string) => {
    setFormData({
      ...formData,
      methods: formData.methods.includes(method)
        ? formData.methods.filter(m => m !== method)
        : [...formData.methods, method],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{route ? 'Edit Route' : 'Add New Route'}</DialogTitle>
          <DialogDescription>
            Configure a routing rule to forward requests to your backend
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Route Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="User API Route"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin_id">Origin Service</Label>
              <select
                id="origin_id"
                value={formData.origin_id}
                onChange={(e) => setFormData({ ...formData, origin_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select an origin</option>
                {origins?.map((origin) => (
                  <option key={origin.id} value={origin.id}>
                    {origin.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="path_pattern">Path Pattern</Label>
              <Input
                id="path_pattern"
                value={formData.path_pattern}
                onChange={(e) => setFormData({ ...formData, path_pattern: e.target.value })}
                placeholder="/api/users/*"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>HTTP Methods</Label>
              <div className="flex flex-wrap gap-2">
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={formData.methods.includes(method) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth_mode">Authentication Mode</Label>
              <select
                id="auth_mode"
                value={formData.auth_mode}
                onChange={(e) => setFormData({ ...formData, auth_mode: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="public">Public</option>
                <option value="jwt_required">JWT Required</option>
                <option value="apikey_required">API Key Required</option>
                <option value="both">Both Required</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active" className="flex items-center gap-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Active
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate_limit_enabled" className="flex items-center gap-2">
                <input
                  id="rate_limit_enabled"
                  type="checkbox"
                  checked={formData.rate_limit_enabled}
                  onChange={(e) => setFormData({ ...formData, rate_limit_enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                Enable Rate Limiting
              </Label>
              {formData.rate_limit_enabled && (
                <Input
                  type="number"
                  value={formData.rate_limit_requests_per_second}
                  onChange={(e) => setFormData({ ...formData, rate_limit_requests_per_second: parseInt(e.target.value) || 100 })}
                  placeholder="Requests per second"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cache_enabled" className="flex items-center gap-2">
                <input
                  id="cache_enabled"
                  type="checkbox"
                  checked={formData.cache_enabled}
                  onChange={(e) => setFormData({ ...formData, cache_enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                Enable Caching
              </Label>
              {formData.cache_enabled && (
                <Input
                  type="number"
                  value={formData.cache_ttl_seconds}
                  onChange={(e) => setFormData({ ...formData, cache_ttl_seconds: parseInt(e.target.value) || 60 })}
                  placeholder="TTL in seconds"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : route ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

