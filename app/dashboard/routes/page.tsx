'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Route as RouteIcon, 
  Edit2, 
  Trash2,
  Search,
  Power,
  PowerOff,
  Shield,
  Zap,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClientAPI } from '@/lib/api/client-api'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Route } from '@/lib/types'
import { AddRouteDialog } from '@/components/dashboard/add-route-dialog'
import { toast } from 'sonner'

export default function RoutesPage() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  // Fetch routes
  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      const response = await api.get(`/routes/tenant/${tenantId}`)
      const data = response.data
      if (Array.isArray(data)) {
        return data as Route[]
      }
      if (data && Array.isArray(data.data)) {
        return data.data as Route[]
      }
      if (data && Array.isArray(data.routes)) {
        return data.routes as Route[]
      }
      return [] as Route[]
    },
    enabled: !!tenantId,
  })

  // Toggle route mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      await api.patch(`/routes/${id}`, { is_active: !isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', tenantId] })
      toast.success('Route updated')
    },
  })

  // Delete route mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      await api.delete(`/routes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', tenantId] })
      toast.success('Route deleted')
    },
  })

  const filteredRoutes = Array.isArray(routes)
    ? routes.filter(route =>
        route.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.path_pattern?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const getAuthBadge = (authMode: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      public: { color: 'bg-blue-500/10 text-blue-500', icon: Shield },
      jwt_required: { color: 'bg-purple-500/10 text-purple-500', icon: Shield },
      apikey_required: { color: 'bg-green-500/10 text-green-500', icon: Shield },
      both: { color: 'bg-orange-500/10 text-orange-500', icon: Shield },
    }
    return variants[authMode] || variants.public
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Routes</h1>
          <p className="text-muted-foreground mt-1">
            Configure routing rules and policies
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Route
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shimmer h-32" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoutes?.map((route, i) => {
            const authBadge = getAuthBadge(route.auth_mode)
            const AuthIcon = authBadge.icon

            return (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="card-hover group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                          <RouteIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {route.name}
                            {!route.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {route.path_pattern}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMutation.mutate({ id: route.id, isActive: route.is_active })}
                        >
                          {route.is_active ? (
                            <Power className="h-4 w-4 text-success" />
                          ) : (
                            <PowerOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRoute(route)
                            setIsAddDialogOpen(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this route?')) {
                              deleteMutation.mutate(route.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={authBadge.color}>
                        <AuthIcon className="h-3 w-3 mr-1" />
                        {route.auth_mode.replace('_', ' ')}
                      </Badge>
                      {route.methods.map((method) => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                      {route.rate_limit_enabled && (
                        <Badge className="bg-yellow-500/10 text-yellow-500">
                          <Zap className="h-3 w-3 mr-1" />
                          {route.rate_limit_requests_per_second} req/s
                        </Badge>
                      )}
                      {route.cache_enabled && (
                        <Badge className="bg-blue-500/10 text-blue-500">
                          <Database className="h-3 w-3 mr-1" />
                          {route.cache_ttl_seconds}s TTL
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {filteredRoutes?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <RouteIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No routes found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Create your first routing rule to get started
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Route
            </Button>
          </CardContent>
        </Card>
      )}

      <AddRouteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        route={selectedRoute}
        onSuccess={() => {
          setIsAddDialogOpen(false)
          setSelectedRoute(null)
        }}
      />
    </div>
  )
}
