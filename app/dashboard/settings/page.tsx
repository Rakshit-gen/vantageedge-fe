'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { 
  Settings,
  User,
  Building2,
  Bell,
  Shield,
  Globe,
  Save,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientAPI } from '@/lib/api/client-api'
import { createAuthAPI } from '@/lib/api/client-api'
import { useTenant } from '@/lib/contexts/tenant-context'
import { useAuth } from '@clerk/nextjs'
import { Tenant } from '@/lib/types'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { tenantId } = useTenant()
  const { user } = useUser()
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'tenant' | 'notifications' | 'security'>('profile')

  // Fetch tenant settings - try to get from backend first, fallback to using tenantId
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantId, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required')
      }
      
      try {
        // Try to get tenant from auth endpoint first
        const token = await getToken()
        if (token) {
          const authApi = createAuthAPI(getToken)
          const response = await authApi.get(`/auth/tenant?clerk_user_id=${encodeURIComponent(user.id)}`)
          if (response.data) {
            return response.data as Tenant
          }
        }
      } catch (err) {
        console.log('Auth endpoint failed, trying direct tenant lookup:', err)
      }
      
      // Fallback: try to get tenant using tenantId (Clerk ID)
      if (tenantId) {
        try {
          const api = createClientAPI(tenantId)
          const response = await api.get(`/tenants/${tenantId}`)
          return response.data as Tenant
        } catch (err) {
          // If that fails, create a mock tenant with the Clerk ID
          console.log('Direct tenant lookup failed, using Clerk ID as tenant ID:', err)
          return {
            id: tenantId,
            name: 'My Workspace',
            subdomain: tenantId.substring(0, 20),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Tenant
        }
      }
      
      throw new Error('Unable to fetch tenant information')
    },
    enabled: !!user?.id,
  })

  const updateTenantMutation = useMutation({
    mutationFn: async (data: Partial<Tenant>) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const api = createClientAPI(tenantId)
      // Note: This endpoint may need to be created or updated
      await api.patch(`/tenants/${tenantId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
      toast.success('Settings updated successfully')
    },
    onError: () => {
      toast.error('Failed to update settings')
    },
  })

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'tenant' as const, label: 'Tenant', icon: Building2 },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and tenant settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1 border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={user?.firstName || ''}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={user?.lastName || ''}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Profile information is managed through Clerk. Update it in your Clerk dashboard.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'tenant' && (
            <TenantSettings
              tenant={tenant}
              tenantId={tenantId}
              isLoading={isLoading}
              onUpdate={(data) => updateTenantMutation.mutate(data)}
              isUpdating={updateTenantMutation.isPending}
              user={user}
            />
          )}

          {activeTab === 'notifications' && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive email alerts for important events</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rate Limit Alerts</Label>
                    <p className="text-xs text-muted-foreground">Get notified when rate limits are exceeded</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Error Alerts</Label>
                    <p className="text-xs text-muted-foreground">Receive alerts for API errors</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">
                    Two-factor authentication is managed through Clerk
                  </p>
                  <Button variant="outline" size="sm">
                    Manage 2FA
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>API Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Manage your API keys and access tokens
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/dashboard/api-keys">View API Keys</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function TenantSettings({
  tenant,
  tenantId,
  isLoading,
  onUpdate,
  isUpdating,
  user,
}: {
  tenant?: Tenant
  tenantId: string | null
  isLoading: boolean
  onUpdate: (data: Partial<Tenant>) => void
  isUpdating: boolean
  user: any
}) {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    subdomain: tenant?.subdomain || '',
  })

  if (isLoading) {
    return <Card className="border-border/50 bg-card/50 shimmer h-64" />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle>Tenant Settings</CardTitle>
        <CardDescription>
          Configure your tenant information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Company"
              className="bg-background/50 border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                placeholder="mycompany"
                className="bg-background/50 border-border/50"
              />
              <span className="text-sm text-muted-foreground">.vantageedge.dev</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your gateway will be accessible at https://{formData.subdomain || 'subdomain'}.vantageedge.dev
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tenant ID</Label>
            <div className="flex items-center gap-2">
              <Input
                value={tenantId || user?.id || 'Loading...'}
                readOnly
                className="bg-muted/50 font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const idToCopy = tenantId || user?.id
                  if (idToCopy) {
                    navigator.clipboard.writeText(idToCopy)
                    toast.success('Tenant ID copied to clipboard')
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this Clerk User ID in API requests. The backend will automatically resolve it to your tenant.
              {tenant?.id && tenant.id !== tenantId && (
                <span className="block mt-1">Backend Tenant UUID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{tenant.id}</code></span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isUpdating} className="gap-2">
              <Save className="h-4 w-4" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

