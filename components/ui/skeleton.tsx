import { cn } from '@/lib/utils'

/** A loading placeholder. A quiet breath, not a shimmer sweep. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded border border-border/60 bg-muted', className)} {...props} />
}
