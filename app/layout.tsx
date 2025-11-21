import './globals.css'
import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'VantageEdge - Next-Gen API Gateway',
  description: 'Enterprise API Gateway with intelligent caching, advanced rate limiting, and real-time analytics',
  keywords: ['API Gateway', 'Rate Limiting', 'Caching', 'Analytics', 'Multi-tenant'],
  icons: {
    icon: '/gate.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className="dark">
        <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
          <Providers>
            {children}
            <Toaster position="top-right" richColors />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
