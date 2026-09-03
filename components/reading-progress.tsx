'use client'

import { useEffect, useState } from 'react'

/** A hairline bar across the top that fills as the page is scrolled. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const el = document.documentElement
    const update = () => {
      const max = el.scrollHeight - el.clientHeight
      setPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-40 h-0.5">
      <div
        className="h-full bg-patch transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
