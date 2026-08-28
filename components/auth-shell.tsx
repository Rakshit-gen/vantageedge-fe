import Link from 'next/link'
import { Patchboard } from '@/components/patchboard'

const L = [
  { id: 'a', label: '/api/orders/*', state: 'on' as const },
  { id: 'b', label: '/api/catalog/*', state: 'on' as const },
  { id: 'c', label: '/api/auth/*', state: 'on' as const },
  { id: 'd', label: '/api/search', state: 'warn' as const },
]
const R = [
  { id: 'x', label: 'orders-svc', state: 'on' as const },
  { id: 'y', label: 'catalog-svc', state: 'on' as const },
  { id: 'z', label: 'identity', state: 'on' as const },
]
const C = [
  { from: 'a', to: 'x', active: true, live: true },
  { from: 'b', to: 'y', active: true, live: true },
  { from: 'c', to: 'z', active: true, live: false },
  { from: 'd', to: 'y', active: true, live: true },
]

/** Clerk theme + the split layout both auth screens share. */
export const clerkAppearance = {
  variables: {
    colorPrimary: 'hsl(12 68% 54%)',
    colorBackground: 'hsl(38 8% 10%)',
    colorInputBackground: 'hsl(40 9% 7%)',
    colorInputText: 'hsl(42 24% 87%)',
    colorText: 'hsl(42 24% 87%)',
    colorTextSecondary: 'hsl(40 7% 54%)',
    colorDanger: 'hsl(4 62% 52%)',
    borderRadius: '0.25rem',
    fontFamily: 'var(--font-sans)',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-card border border-border shadow-none',
    headerTitle: 'font-display',
    socialButtonsBlockButton: 'border border-border bg-secondary hover:bg-accent',
    formButtonPrimary: 'bg-patch hover:bg-patch/90 text-primary-foreground',
    formFieldInput: 'bg-background border-border',
    footerActionLink: 'text-patch hover:text-patch/80',
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground',
  },
}

export function AuthShell({ children, blurb }: { children: React.ReactNode; blurb: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-border bg-card/40 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-patch" />
          <span className="font-display text-sm font-semibold tracking-tight">VantageEdge</span>
        </Link>
        <div>
          <Patchboard left={L} right={R} cables={C} height={240} />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{blurb}</p>
        </div>
        <p className="ledger text-[11px] text-muted-foreground">the exchange</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
