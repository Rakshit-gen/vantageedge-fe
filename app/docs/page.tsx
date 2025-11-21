'use client'

import { motion } from 'framer-motion'
import { 
  Book, 
  Code, 
  Key, 
  Route, 
  Server, 
  Zap, 
  Shield, 
  Database,
  ArrowRight,
  Copy,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function DocsPage() {
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied to clipboard')
  }

  const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => (
    <div className="relative group">
      <pre className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono">{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyCode(code)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">VantageEdge Docs</h1>
                <p className="text-xs text-muted-foreground">API Gateway Documentation</p>
              </div>
            </div>
            <Button asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold gradient-text mb-4">
            VantageEdge API Gateway
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade API Gateway with intelligent routing, caching, rate limiting, and real-time analytics
          </p>
        </motion.div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          <Card className="card-hover cursor-pointer" onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Quick Start</CardTitle>
            </CardHeader>
          </Card>
          <Card className="card-hover cursor-pointer" onClick={() => document.getElementById('authentication')?.scrollIntoView({ behavior: 'smooth' })}>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Authentication</CardTitle>
            </CardHeader>
          </Card>
          <Card className="card-hover cursor-pointer" onClick={() => document.getElementById('api-reference')?.scrollIntoView({ behavior: 'smooth' })}>
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">API Reference</CardTitle>
            </CardHeader>
          </Card>
          <Card className="card-hover cursor-pointer" onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })}>
            <CardHeader>
              <Book className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Examples</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Getting Started */}
        <section id="getting-started" className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Getting Started</h2>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>1. Get Your API Key</CardTitle>
                <CardDescription>
                  Sign up and generate an API key from the dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  After signing up, navigate to <strong>Dashboard → API Keys</strong> and generate your first API key.
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm">API keys are prefixed with <code className="bg-muted px-1 py-0.5 rounded">ve_live_</code></span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Authentication */}
        <section id="authentication" className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Authentication</h2>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Key Authentication
                  </CardTitle>
                  <CardDescription>
                    Use your API key in the X-API-Key header
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock code={`curl -X GET "https://vantageedge.onrender.com/api/v1/api-keys/tenant/YOUR_TENANT_ID" \\
  -H "X-API-Key: ve_live_your_api_key_here"`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    JWT Token Authentication
                  </CardTitle>
                  <CardDescription>
                    Use Clerk JWT token in Authorization header
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock code={`curl -X GET "https://vantageedge.onrender.com/api/v1/origins/tenant/YOUR_TENANT_ID" \\
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN"`} />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* API Reference */}
        <section id="api-reference" className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Code className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">API Reference</h2>
            </div>

            <div className="space-y-6">
              {/* Origins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Origins (Backend Services)
                  </CardTitle>
                  <CardDescription>Manage your backend services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">POST</Badge>
                    <p className="text-sm font-medium mb-2">Create Origin</p>
                    <CodeBlock code={`curl -X POST "https://vantageedge.onrender.com/api/v1/origins" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "YOUR_TENANT_ID",
    "name": "My Backend API",
    "url": "https://api.example.com",
    "health_check_path": "/health",
    "timeout_seconds": 30,
    "weight": 100
  }'`} />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">GET</Badge>
                    <p className="text-sm font-medium mb-2">List Origins</p>
                    <CodeBlock code={`curl -X GET "https://vantageedge.onrender.com/api/v1/origins/tenant/YOUR_TENANT_ID" \\
  -H "X-API-Key: YOUR_API_KEY"`} />
                  </div>
                </CardContent>
              </Card>

              {/* Routes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5" />
                    Routes
                  </CardTitle>
                  <CardDescription>Configure routing rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">POST</Badge>
                    <p className="text-sm font-medium mb-2">Create Route</p>
                    <CodeBlock code={`curl -X POST "https://vantageedge.onrender.com/api/v1/routes" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "YOUR_TENANT_ID",
    "origin_id": "ORIGIN_ID",
    "name": "Users API",
    "path_pattern": "/api/users/*",
    "methods": ["GET", "POST"],
    "auth_mode": "public",
    "is_active": true
  }'`} />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">GET</Badge>
                    <p className="text-sm font-medium mb-2">List Routes</p>
                    <CodeBlock code={`curl -X GET "https://vantageedge.onrender.com/api/v1/routes/tenant/YOUR_TENANT_ID" \\
  -H "X-API-Key: YOUR_API_KEY"`} />
                  </div>
                </CardContent>
              </Card>

              {/* API Keys */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>Manage API keys for authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">POST</Badge>
                    <p className="text-sm font-medium mb-2">Generate API Key</p>
                    <CodeBlock code={`curl -X POST "https://vantageedge.onrender.com/api/v1/api-keys" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "YOUR_TENANT_ID",
    "name": "Production Key",
    "scopes": ["read", "write"]
  }'`} />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">GET</Badge>
                    <p className="text-sm font-medium mb-2">List API Keys</p>
                    <CodeBlock code={`curl -X GET "https://vantageedge.onrender.com/api/v1/api-keys/tenant/YOUR_TENANT_ID" \\
  -H "X-API-Key: YOUR_API_KEY"`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Features</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-primary" />
                    Intelligent Routing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Path pattern matching, multiple HTTP methods, priority-based routing, and path rewriting
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Distributed Caching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Redis-powered caching with configurable TTL, cache key patterns, and hit/miss tracking
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Rate Limiting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Token bucket and sliding window algorithms with per-route configuration
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Load Balancing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Round-robin, least connections, and consistent hashing strategies with health checks
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* Examples */}
        <section id="examples" className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Book className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Examples</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Complete Setup Example</CardTitle>
                <CardDescription>End-to-end example of setting up a route</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">1. Create an Origin</p>
                  <CodeBlock code={`curl -X POST "https://vantageedge.onrender.com/api/v1/origins" \\
  -H "X-API-Key: ve_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "user_35nWDaBYe62a2J01bBDm1k2lej7",
    "name": "JSONPlaceholder",
    "url": "https://jsonplaceholder.typicode.com",
    "health_check_path": "/",
    "timeout_seconds": 30,
    "weight": 100
  }'`} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">2. Create a Route</p>
                  <CodeBlock code={`curl -X POST "https://vantageedge.onrender.com/api/v1/routes" \\
  -H "X-API-Key: ve_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "user_35nWDaBYe62a2J01bBDm1k2lej7",
    "origin_id": "ORIGIN_ID_FROM_STEP_1",
    "name": "Posts API",
    "path_pattern": "/api/posts/*",
    "methods": ["GET"],
    "auth_mode": "public",
    "is_active": true
  }'`} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">3. Test the Route</p>
                  <CodeBlock code={`# Once gateway is configured, test your route:
curl https://your-subdomain.vantageedge.dev/api/posts/1`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Auth Modes */}
        <section id="auth-modes" className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Authentication Modes</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Public</CardTitle>
                  <CardDescription>No authentication required</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">public</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>JWT Required</CardTitle>
                  <CardDescription>Clerk JWT token needed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">jwt_required</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Key Required</CardTitle>
                  <CardDescription>X-API-Key header needed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">apikey_required</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Both Required</CardTitle>
                  <CardDescription>JWT and API key both needed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">both</Badge>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl font-bold mb-4 gradient-text">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Sign up for free and start managing your API gateway in minutes
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="/auth/sign-up">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

