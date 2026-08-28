'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface ListKeysOptions {
  count: number
  onEnter?: (index: number) => void
  onToggle?: (index: number) => void
  /** Ref to the search box so `/` can focus it. */
  searchRef?: React.RefObject<HTMLInputElement>
}

/**
 * j/k to move the cursor, Enter to open, x to toggle, / to focus search.
 * Ignores keystrokes while an input/textarea/select is focused.
 */
export function useListKeys({ count, onEnter, onToggle, searchRef }: ListKeysOptions) {
  const [cursor, setCursor] = useState(-1)
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor

  useEffect(() => {
    if (cursor >= count) setCursor(count - 1)
  }, [count, cursor])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable)

      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef?.current?.focus()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return

      const i = cursorRef.current
      if (e.key === 'j') {
        e.preventDefault()
        setCursor((c) => Math.min(count - 1, c + 1))
      } else if (e.key === 'k') {
        e.preventDefault()
        setCursor((c) => Math.max(0, c - 1))
      } else if (e.key === 'Enter' && i >= 0) {
        onEnter?.(i)
      } else if (e.key === 'x' && i >= 0) {
        e.preventDefault()
        onToggle?.(i)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [count, onEnter, onToggle, searchRef])

  const reset = useCallback(() => setCursor(-1), [])
  return { cursor, setCursor, reset }
}
