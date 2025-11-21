'use client'

import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Globe,
  Server,
  Route,
  Key
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const stats = [
  {
    title: 'Total Requests',
    value: '2,543,891',
    change: '+12.5%',
    trend: 'up',
    icon: Activity,
  },
  {
    title: 'Cache Hit Rate',
    value: '87.2%',
    change: '+3.1%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Avg Response Time',
    value: '8.3ms',
    change: '-2.4ms',
    trend: 'up',
    icon: Zap,
  },
  {
    title: 'Error Rate',
    value: '0.23%',
    change: '-0.05%',
    trend: 'up',
    icon: AlertCircle,
  },
]

const topRoutes = [
  { path: '/api/users', requests: '1.2M', latency: '7ms', change: '+8%' },
  { path: '/api/posts', requests: '890K', latency: '12ms', change: '+5%' },
  { path: '/api/comments', requests: '654K', latency: '9ms', change: '-2%' },
  { path: '/api/products', requests: '421K', latency: '15ms', change: '+12%' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with your API gateway.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? ArrowUp : ArrowDown
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center space-x-1 text-xs mt-1">
                    <TrendIcon className="h-3 w-3 text-success" />
                    <span className="text-success font-medium">{stat.change}</span>
                    <span className="text-muted-foreground">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Request Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Request Overview</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center space-y-2">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Chart will be rendered here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Routes</CardTitle>
            <CardDescription>Most requested endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRoutes.map((route, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border bg-accent/5 hover:bg-accent/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium">{route.path}</div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {route.requests} requests
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {route.latency}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-medium",
                    route.change.startsWith('+') ? "text-success" : "text-muted-foreground"
                  )}>
                    {route.change}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.a
              href="/dashboard/services"
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Add Service</div>
                <div className="text-xs text-muted-foreground">Configure origin</div>
              </div>
            </motion.a>

            <motion.a
              href="/dashboard/routes"
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 p-4 rounded-lg border bg-gradient-to-br from-purple-500/5 to-purple-500/10 hover:from-purple-500/10 hover:to-purple-500/20 transition-all cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <Route className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="font-medium">Create Route</div>
                <div className="text-xs text-muted-foreground">Add routing rule</div>
              </div>
            </motion.a>

            <motion.a
              href="/dashboard/api-keys"
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 p-4 rounded-lg border bg-gradient-to-br from-green-500/5 to-green-500/10 hover:from-green-500/10 hover:to-green-500/20 transition-all cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <Key className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="font-medium">Generate API Key</div>
                <div className="text-xs text-muted-foreground">Create access token</div>
              </div>
            </motion.a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
