'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Database, 
  Search,
  Trash2,
  RefreshCw,
  Key,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClientAPI } from '@/lib/api/client-api'
import { useTenant } from '@/lib/contexts/tenant-context'
import { CacheEntry } from '@/lib/types'
import { toast } from 'sonner'
import { formatDateTime, formatDuration } from '@/lib/utils'

export default function CachePage() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch cache entries
  const { data: cacheEntries, isLoading } = useQuery({
    queryKey: ['cache-entries', searchQuery, tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      const params = searchQuery ? { search: searchQuery } : {}
      const response = await api.get('/cache/entries', { params })
      const data = response.data
      if (Array.isArray(data)) {
        return data as CacheEntry[]
      }
      if (data && Array.isArray(data.data)) {
        return data.data as CacheEntry[]
      }
      if (data && Array.isArray(data.entries)) {
        return data.entries as CacheEntry[]
      }
      return [] as CacheEntry[]
    },
    enabled: !!tenantId,
  })

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async (key?: string) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      if (key) {
        await api.delete(`/cache/entries/${encodeURIComponent(key)}`)
      } else {
        await api.delete('/cache/clear')
      }
    },
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: ['cache-entries'] })
      toast.success(key ? 'Cache entry deleted' : 'Cache cleared')
    },
    onError: () => {
      toast.error('Failed to clear cache')
    },
  })

  // Refresh cache stats
  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      const response = await api.get('/cache/stats')
      return response.data
    },
    enabled: !!tenantId,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Cache Explorer</h1>
          <p className="text-muted-foreground mt-1">
            View and manage cached entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => clearCacheMutation.mutate(undefined)}
            disabled={clearCacheMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${clearCacheMutation.isPending ? 'animate-spin' : ''}`} />
            Clear All
          </Button>
        </div>
      </div>

      {/* Cache Stats */}
      {cacheStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cacheStats.total_entries || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cacheStats.hit_rate ? `${(cacheStats.hit_rate * 100).toFixed(1)}%` : '0%'}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Used</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cacheStats.memory_used ? `${(cacheStats.memory_used / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cache keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cache Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shimmer h-32 border-border/50 bg-card/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {cacheEntries?.map((entry, i) => (
            <motion.div
              key={entry.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="card-hover border-border/50 bg-card/50 group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex-shrink-0">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-mono text-sm truncate">
                          {entry.key}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            TTL: {formatDuration(entry.ttl * 1000)}
                          </span>
                          <span>Hits: {entry.hit_count}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {new Date(entry.expires_at) > new Date() ? 'Active' : 'Expired'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearCacheMutation.mutate(entry.key)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDateTime(entry.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{formatDateTime(entry.expires_at)}</span>
                    </div>
                    <div className="mt-3 p-2 rounded bg-muted/30 border border-border/50">
                      <pre className="text-xs overflow-x-auto">
                        {typeof entry.value === 'string' 
                          ? entry.value.substring(0, 200) + (entry.value.length > 200 ? '...' : '')
                          : JSON.stringify(entry.value, null, 2).substring(0, 200) + '...'
                        }
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {cacheEntries?.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cache entries found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Cache entries will appear here as requests are made through the gateway
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

