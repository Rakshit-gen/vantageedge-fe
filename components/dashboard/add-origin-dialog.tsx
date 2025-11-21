'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Origin } from '@/lib/types'
import { toast } from 'sonner'

interface AddOriginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin?: Origin | null
  onSuccess?: () => void
}

export function AddOriginDialog({
  open,
  onOpenChange,
  origin,
  onSuccess,
}: AddOriginDialogProps) {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    health_check_path: '/health',
    health_check_interval: 30,
    timeout_seconds: 5,
    max_retries: 3,
    weight: 1,
  })

  useEffect(() => {
    if (origin) {
      setFormData({
        name: origin.name,
        url: origin.url,
        health_check_path: origin.health_check_path,
        health_check_interval: origin.health_check_interval,
        timeout_seconds: origin.timeout_seconds,
        max_retries: origin.max_retries,
        weight: origin.weight,
      })
    } else {
      setFormData({
        name: '',
        url: '',
        health_check_path: '/health',
        health_check_interval: 30,
        timeout_seconds: 5,
        max_retries: 3,
        weight: 1,
      })
    }
  }, [origin, open])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      if (origin) {
        await api.patch(`/origins/${origin.id}`, data)
      } else {
        await api.post('/origins', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['origins', tenantId] })
      toast.success(origin ? 'Origin updated successfully' : 'Origin created successfully')
      onOpenChange(false)
      onSuccess?.()
    },
    onError: () => {
      toast.error(origin ? 'Failed to update origin' : 'Failed to create origin')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{origin ? 'Edit Origin' : 'Add New Origin'}</DialogTitle>
          <DialogDescription>
            Configure a backend service origin for routing requests
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Backend Service"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health_check_path">Health Check Path</Label>
              <Input
                id="health_check_path"
                value={formData.health_check_path}
                onChange={(e) => setFormData({ ...formData, health_check_path: e.target.value })}
                placeholder="/health"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
                <Input
                  id="timeout_seconds"
                  type="number"
                  value={formData.timeout_seconds}
                  onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) || 5 })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
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
              {mutation.isPending ? 'Saving...' : origin ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

