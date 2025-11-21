'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/lib/contexts/tenant-context'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Key, 
  Copy, 
  Trash2,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClientAPI } from '@/lib/api/client-api'
import { APIKey } from '@/lib/types'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function APIKeysPage() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null)

  // Fetch API keys
  const { data: apiKeys, isLoading, error, refetch } = useQuery({
    queryKey: ['api-keys', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      try {
        const api = createClientAPI(tenantId)
        const response = await api.get(`/api-keys/tenant/${tenantId}`)
        // Handle different response structures
        const data = response.data
        if (Array.isArray(data)) {
          return data as APIKey[]
        }
        if (data && Array.isArray(data.data)) {
          return data.data as APIKey[]
        }
        if (data && Array.isArray(data.api_keys)) {
          return data.api_keys as APIKey[]
        }
        return [] as APIKey[]
      } catch (err: any) {
        // Log the error for debugging
        console.error('Failed to fetch API keys:', err)
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        })
        
        // Only redirect to sign-in if it's a 401 (handled by interceptor)
        // For other errors, throw so React Query can handle it properly
        if (err.response?.status === 401) {
          throw err // Let 401 be handled by interceptor
        }
        
        // For other errors, return empty array so page still renders
        // But also throw so React Query knows there was an error
        if (err.response?.status >= 500) {
          // Server error - return empty but mark as error
          throw err
        }
        
        // For client errors (400, 404, etc), return empty array
        return [] as APIKey[]
      }
    },
    enabled: !!tenantId, // Only run query when tenantId is available
    retry: (failureCount, error: any) => {
      // Retry once on errors
      return failureCount < 1
    },
    retryDelay: 1000,
  })

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; scopes: string[]; expires_at?: string }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      const response = await api.post('/api-keys', { ...data, tenant_id: tenantId })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setNewKey({ key: data.key, name: data.name })
      setIsAddDialogOpen(false)
      toast.success('API key created successfully')
    },
    onError: () => {
      toast.error('Failed to create API key')
    },
  })

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      await api.delete(`/api-keys/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key deleted')
    },
    onError: () => {
      toast.error('Failed to delete API key')
    },
  })

  const filteredKeys = Array.isArray(apiKeys) 
    ? apiKeys.filter(key =>
        key.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.key_prefix?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatKey = (key: string) => {
    if (key.length <= 20) return key
    return `${key.substring(0, 12)}...${key.substring(key.length - 8)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for service-to-service authentication
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Key
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search API keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* New Key Display Dialog */}
      {newKey && (
        <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy this key now. You won't be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input value={newKey.name} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input value={newKey.key} readOnly className="font-mono text-sm bg-muted/50" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(newKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewKey(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Key Dialog */}
      <AddKeyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Loading State */}
      {!tenantId && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading tenant information...</h3>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Key className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Failed to load API keys</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {(error as any).response?.data?.error || (error as any).message || 'An error occurred while fetching API keys'}
                </p>
                {(error as any).response?.status === 404 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your user may not be synced with the backend. Please contact support.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shimmer h-32 border-border/50 bg-card/50" />
          ))}
        </div>
      ) : !error || (error as any).response?.status === 401 ? (
        <div className="space-y-4">
          {filteredKeys?.map((key, i) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="card-hover border-border/50 bg-card/50 group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {key.name}
                          {!key.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">
                          {visibleKeys.has(key.id) ? key.key_prefix : formatKey(key.key_prefix)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this API key?')) {
                            deleteMutation.mutate(key.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Scopes:</span>
                      <div className="flex gap-1">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {key.expires_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Expires: {new Date(key.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Usage:</span>
                      <span className="font-medium">{key.usage_count}</span>
                    </div>
                    {key.last_used_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Last used:</span>
                        <span>{new Date(key.last_used_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}

      {!isLoading && !error && filteredKeys?.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Generate your first API key to enable service-to-service authentication
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state when there's an error but we still want to show the UI */}
      {error && (error as any).response?.status === 404 && filteredKeys?.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load API keys</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Your account may need to be synced with the backend. Please try refreshing the page or contact support.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AddKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; scopes: string[]; expires_at?: string }) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    scopes: ['read'] as string[],
    expires_at: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: formData.name,
      scopes: formData.scopes,
      expires_at: formData.expires_at || undefined,
    })
    setFormData({ name: '', scopes: ['read'], expires_at: '' })
  }

  const toggleScope = (scope: string) => {
    setFormData({
      ...formData,
      scopes: formData.scopes.includes(scope)
        ? formData.scopes.filter(s => s !== scope)
        : [...formData.scopes, scope],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for service-to-service authentication
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Production API Key"
                required
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="flex flex-wrap gap-2">
                {['read', 'write', 'admin'].map((scope) => (
                  <Button
                    key={scope}
                    type="button"
                    variant={formData.scopes.includes(scope) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleScope(scope)}
                  >
                    {scope}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="bg-background/50 border-border/50"
              />
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
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? 'Creating...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

