'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  Zap,
  Clock,
  Globe,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientAPI } from '@/lib/api/client-api'
import { useTenant } from '@/lib/contexts/tenant-context'
import { AnalyticsData } from '@/lib/types'
import { formatNumber, formatPercent, formatDuration } from '@/lib/utils'

export default function AnalyticsPage() {
  const { tenantId } = useTenant()

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      const response = await api.get('/analytics')
      return response.data as AnalyticsData
    },
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const stats = analytics ? [
    {
      title: 'Total Requests',
      value: formatNumber(analytics.total_requests),
      icon: Activity,
    },
    {
      title: 'Cache Hit Rate',
      value: formatPercent(analytics.cache_hit_rate),
      icon: TrendingUp,
    },
    {
      title: 'Avg Response Time',
      value: formatDuration(analytics.avg_response_time),
      icon: Zap,
    },
    {
      title: 'Error Rate',
      value: formatPercent(analytics.error_rate),
      icon: AlertCircle,
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Real-time insights into your API gateway performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="shimmer h-32 border-border/50 bg-card/50" />
          ))
        ) : (
          stats.map((stat, i) => {
            const Icon = stat.icon
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card className="card-hover border-border/50 bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Request Status Distribution */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Requests by Status</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] shimmer" />
            ) : analytics ? (
              <div className="space-y-3">
                {Object.entries(analytics.requests_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        status.startsWith('2') ? 'bg-success' :
                        status.startsWith('3') ? 'bg-warning' :
                        status.startsWith('4') ? 'bg-destructive' :
                        'bg-muted-foreground'
                      }`} />
                      <span className="text-sm">{status} {status === '200' ? 'OK' : status === '404' ? 'Not Found' : status === '500' ? 'Error' : ''}</span>
                    </div>
                    <span className="font-medium">{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Top Routes</CardTitle>
            <CardDescription>Most requested endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] shimmer" />
            ) : analytics ? (
              <div className="space-y-3">
                {analytics.top_routes.slice(0, 5).map((route, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium">{route.path}</div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span>{formatNumber(route.count)} requests</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(route.avg_latency)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Request Timeline */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Request Timeline</CardTitle>
          <CardDescription>Requests over time (last 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] shimmer" />
          ) : analytics ? (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg">
              <div className="text-center space-y-2">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization coming soon
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

