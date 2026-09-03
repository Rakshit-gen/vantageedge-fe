'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * The docs table of contents. A left rail on lg+, a horizontal strip below
 * that. Highlights the section currently under the reader as they scroll.
 */
export function DocsNav({ sections }: { sections: string[][] }) {
  const [active, setActive] = useState(sections[0]?.[0] ?? '')

  useEffect(() => {
    const els = sections
      .map(([id]) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (!els.length) return

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  return (
    <nav className="ledger flex gap-x-4 gap-y-1 overflow-x-auto pb-0.5 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
      <span className="eyebrow mb-2 hidden after:hidden lg:flex">on this page</span>
      {sections.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={() => setActive(id)}
          className={cn(
            'shrink-0 whitespace-nowrap border-transparent py-1 text-xs transition-colors lg:border-l-2 lg:pl-3',
            active === id
              ? 'text-patch lg:border-patch'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
