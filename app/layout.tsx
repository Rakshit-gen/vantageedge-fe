import './globals.css'
import type { Metadata } from 'next'
import { Bricolage_Grotesque, Spline_Sans, Spline_Sans_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

// Display: a collage of French and British grotesques, wonky on purpose.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
})

// Body / UI.
const sans = Spline_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans',
})

// The ledger: paths, IDs, latencies, every column that has to line up.
const mono = Spline_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'VantageEdge · the exchange',
  description: 'Patch your APIs through one switchboard: route, pool, rate-limit, cache.',
  icons: { icon: '/gate.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}
      >
        <body className="font-sans antialiased">
          <Providers>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast: 'font-sans border border-border bg-card text-foreground',
                },
              }}
            />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
