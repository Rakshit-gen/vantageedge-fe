'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Server, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Trash2,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClientAPI } from '@/lib/api/client-api'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Origin } from '@/lib/types'
import { AddOriginDialog } from '@/components/dashboard/add-origin-dialog'
import { toast } from 'sonner'

export default function ServicesPage() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedOrigin, setSelectedOrigin] = useState<Origin | null>(null)

  // Fetch origins
  const { data: origins, isLoading } = useQuery({
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

  // Delete origin mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      await api.delete(`/origins/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['origins', tenantId] })
      toast.success('Origin deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete origin')
    },
  })

  const filteredOrigins = Array.isArray(origins)
    ? origins.filter(origin =>
        origin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        origin.url?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your backend origins and services
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Origins Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shimmer h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrigins?.map((origin, i) => (
            <motion.div
              key={origin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="card-hover group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                        <Server className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{origin.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {origin.url}
                        </CardDescription>
                      </div>
                    </div>
                    {origin.is_healthy ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeout</span>
                    <span className="font-medium">{origin.timeout_seconds}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{origin.weight}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={origin.is_healthy ? 'text-success' : 'text-destructive'}>
                      {origin.is_healthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setSelectedOrigin(origin)
                        setIsAddDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this origin?')) {
                          deleteMutation.mutate(origin.id)
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filteredOrigins?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Server className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Get started by adding your first backend service
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      )}

      <AddOriginDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        origin={selectedOrigin}
        onSuccess={() => {
          setIsAddDialogOpen(false)
          setSelectedOrigin(null)
        }}
      />
    </div>
  )
}
