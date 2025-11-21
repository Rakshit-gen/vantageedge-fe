'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Globe2,
  Lock,
  Gauge,
  ArrowRight,
  CheckCircle2,
  Play,
  Github,
  Twitter
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Zap,
    title: 'Lightning Performance',
    description: 'Sub-10ms P99 latency with Go-powered backend. Built for speed at scale.',
    color: 'text-yellow-500'
  },
  {
    icon: Shield,
    title: 'Military-Grade Security',
    description: 'JWT validation, API keys, and rate limiting. SOC 2 Type II compliant.',
    color: 'text-blue-500'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Live metrics, distributed tracing, and performance insights at your fingertips.',
    color: 'text-green-500'
  },
  {
    icon: Globe2,
    title: 'Multi-Tenant Architecture',
    description: 'Isolated environments with subdomain routing and custom configurations.',
    color: 'text-purple-500'
  },
  {
    icon: Lock,
    title: 'Intelligent Caching',
    description: 'Redis-backed distributed caching with automatic invalidation strategies.',
    color: 'text-pink-500'
  },
  {
    icon: Gauge,
    title: 'Flexible Rate Limiting',
    description: 'Token bucket and sliding window algorithms with per-route granularity.',
    color: 'text-orange-500'
  },
]

const stats = [
  { label: 'Uptime', value: '99.9%', suffix: '' },
  { label: 'Avg Latency', value: '< 50', suffix: 'ms' },
  { label: 'API Endpoints', value: '10+', suffix: '' },
  { label: 'Open Source', value: '100%', suffix: '' },
]

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Animated background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      {/* Navigation */}
      <nav className="relative z-50 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
                <Image 
                  src="/gate.png" 
                  alt="VantageEdge" 
                  width={40} 
                  height={40} 
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold gradient-text">VantageEdge</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <div className="h-6 w-px bg-border" />
              <Button variant="ghost" asChild>
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="relative overflow-hidden group">
                <Link href="/auth/sign-up">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center space-x-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-6">
                <Image 
                  src="/gate.png" 
                  alt="VantageEdge" 
                  width={16} 
                  height={16} 
                  className="object-contain"
                />
                <span>Introducing VantageEdge</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6">
                API Gateway
                <br />
                <span className="gradient-text">Reimagined</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Enterprise-grade API management with intelligent caching, advanced rate limiting,
                and real-time analytics. Built for developers who demand excellence.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button size="lg" className="w-full sm:w-auto group" asChild>
                  <Link href="/auth/sign-up">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" className="w-full sm:w-auto group" asChild>
                  <Link href="/docs">
                    View Documentation
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, i) => (
                <div key={i} className="glass rounded-2xl p-6 border card-hover">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {stat.value}
                    {stat.suffix && <span className="text-lg">{stat.suffix}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 md:py-32 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Everything You Need
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Production-ready features that scale with your business
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -8,
                    transition: { duration: 0.3 }
                  }}
                  className="glass rounded-2xl p-8 border border-border/50 card-hover group relative overflow-hidden"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                  
                  <div className="relative z-10">
                    <motion.div 
                      className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-primary/20`}
                      whileHover={{ 
                        scale: 1.15,
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                    >
                      <Icon className={`h-8 w-8 ${feature.color} drop-shadow-lg`} />
                    </motion.div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-3xl p-12 border text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-4">
                  Ready to Transform Your API Infrastructure?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join developers using VantageEdge to power their APIs.
                  Start free, scale infinitely.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/dashboard">
                      View Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Account</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/sign-in" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">API Reference</Link></li>
                <li><Link href="/docs#getting-started" className="hover:text-foreground transition-colors">Getting Started</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                <Image 
                  src="/gate.png" 
                  alt="VantageEdge" 
                  width={32} 
                  height={32} 
                  className="object-contain"
                />
              </div>
              <span className="font-semibold">VantageEdge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 VantageEdge. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link href="https://github.com/rakshit-gen/vantageEdge" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
