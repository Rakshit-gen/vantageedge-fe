'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from '@/lib/utils'

const HOST_KEY = 've-docs-host'
const PLACEHOLDER = /<your-control-plane-host>|<host>/g

type Ctx = { host: string; setHost: (v: string) => void }
const DocsCtx = createContext<Ctx>({ host: '', setHost: () => {} })
export const useDocsConfig = () => useContext(DocsCtx)

/** Holds the reader's own control-plane host, remembered across visits. */
export function DocsConfig({ children }: { children: ReactNode }) {
  const [host, setHost] = useState('')

  useEffect(() => {
    try {
      const v = localStorage.getItem(HOST_KEY)
      if (v) setHost(v)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (host) localStorage.setItem(HOST_KEY, host)
      else localStorage.removeItem(HOST_KEY)
    } catch {}
  }, [host])

  return <DocsCtx.Provider value={{ host, setHost }}>{children}</DocsCtx.Provider>
}

export function HostBar() {
  const { host, setHost } = useDocsConfig()
  return (
    <div className="panel mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <label htmlFor="docs-host" className="eyebrow shrink-0 after:hidden">
        your host
      </label>
      <input
        id="docs-host"
        value={host}
        onChange={(e) => setHost(e.target.value.trim())}
        placeholder="api.vantageedge.example.com"
        spellCheck={false}
        autoCapitalize="off"
        className="ledger min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-patch focus:outline-none"
      />
      <span className="ledger text-[11px] text-muted-foreground">
        {host ? 'patched into every sample below' : 'set this to rewrite the samples'}
      </span>
      {host && (
        <button
          onClick={() => setHost('')}
          className="ledger text-[11px] text-muted-foreground hover:text-foreground"
        >
          reset
        </button>
      )}
    </div>
  )
}

/** A CodeBlock that swaps the host placeholder for the reader's own host. */
export function DocsCode({ code }: { code: string }) {
  const { host } = useDocsConfig()
  const [copied, setCopied] = useState(false)
  const resolved = host ? code.replace(PLACEHOLDER, host) : code

  const parts: ReactNode[] = []
  if (host) {
    const segs = code.split(PLACEHOLDER)
    segs.forEach((s, i) => {
      parts.push(s)
      if (i < segs.length - 1)
        parts.push(
          <span key={i} className="rounded-[2px] bg-patch/15 text-patch">
            {host}
          </span>,
        )
    })
  } else {
    parts.push(code)
  }

  return (
    <div className="group relative">
      <pre className="ledger overflow-x-auto rounded border border-border bg-card p-4 text-xs leading-relaxed text-foreground">
        <code>{parts}</code>
      </pre>
      <button
        onClick={async () => {
          if (await copyText(resolved)) {
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
