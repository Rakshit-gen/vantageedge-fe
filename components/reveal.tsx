'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Wraps a block so it fades and rises into place the first time it scrolls
 * into view. `delay` staggers siblings. The global reduced-motion reset in
 * globals.css already collapses the transition; we also just show the content
 * immediately if IntersectionObserver isn't around.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('reveal', shown && 'is-in', className)}
      style={delay ? ({ '--reveal-delay': `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  )
}
