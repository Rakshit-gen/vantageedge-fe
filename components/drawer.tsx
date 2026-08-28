'use client'

import { Drawer as Vaul } from 'vaul'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Right-side detail drawer. Route/origin detail + edit opens here instead of
 * a modal or a full page nav, so the list stays put behind it.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  eyebrow,
  children,
  footer,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  eyebrow?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange} direction="right">
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
        <Vaul.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-4">
            <div className="min-w-0">
              {eyebrow && (
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {eyebrow}
                </div>
              )}
              <Vaul.Title className="mt-0.5 truncate font-display text-base font-semibold uppercase tracking-wide">
                {title}
              </Vaul.Title>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">{children}</div>

          {footer && <div className="border-t border-border p-4">{footer}</div>}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  )
}
