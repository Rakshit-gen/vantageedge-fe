'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditProps {
  value: string | number
  onCommit: (next: string) => void | Promise<unknown>
  type?: 'text' | 'number'
  suffix?: string
  min?: number
  className?: string
  /** Render for display when not editing (defaults to `${value}${suffix}`). */
  display?: (value: string | number) => React.ReactNode
}

/**
 * Click the value to edit it in place. Enter or blur commits, Escape
 * cancels. The commit is optimistic upstream, so there's no spinner —
 * a failed write rolls back and toasts.
 */
export function InlineEdit({
  value,
  onCommit,
  type = 'text',
  suffix,
  min,
  className,
  display,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const committedRef = useRef(false)

  useEffect(() => {
    if (!editing) setDraft(String(value))
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    if (committedRef.current) return
    committedRef.current = true
    setEditing(false)
    if (draft !== String(value) && draft.trim() !== '') onCommit(draft.trim())
  }

  if (editing) {
    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          min={min}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(String(value))
              setEditing(false)
            }
          }}
          className="h-6 w-20 rounded border border-ring bg-background px-1.5 font-mono text-xs focus:outline-none"
        />
        <Check className="h-3 w-3 text-lamp" />
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        committedRef.current = false
        setEditing(true)
      }}
      className={cn(
        'group inline-flex items-center gap-1 rounded px-1 -mx-1 font-mono text-xs hover:bg-accent',
        className,
      )}
    >
      {display ? display(value) : `${value}${suffix ?? ''}`}
      <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
    </button>
  )
}
