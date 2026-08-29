'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from '@/lib/utils'

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative">
      <pre className="ledger overflow-x-auto rounded border border-border bg-card p-4 text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
      <button
        onClick={async () => {
          if (await copyText(code)) {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }
        }}
        className="absolute right-2 top-2 rounded border border-border bg-background p-1.5 text-muted-foreground opacity-100 transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
