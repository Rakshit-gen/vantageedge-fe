import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SignedIn, SignedOut } from '@clerk/nextjs'

/**
 * Landing-page call to action. Signed in, it opens the console; signed out,
 * it points at sign-in. Works in a server component (Clerk control components).
 */
export function ConsoleCta({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'md' | 'lg'
}) {
  const pad = size === 'lg' ? 'px-5 py-2.5' : 'px-4 py-2'
  const cls = `inline-flex items-center gap-2 rounded bg-patch ${pad} text-sm font-medium text-primary-foreground ${className ?? ''}`
  return (
    <>
      <SignedIn>
        <Link href="/dashboard" className={cls}>
          Open the console <ArrowRight className="h-4 w-4" />
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href="/auth/sign-in" className={cls}>
          Sign in <ArrowRight className="h-4 w-4" />
        </Link>
      </SignedOut>
    </>
  )
}
