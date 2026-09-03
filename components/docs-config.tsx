'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn, copyText } from '@/lib/utils'

const HOST_KEY = 've-docs-host'
const LANG_KEY = 've-docs-lang'
const PLACEHOLDER = /<your-control-plane-host>|<host>/g

type Lang = 'curl' | 'js'
type Ctx = { host: string; setHost: (v: string) => void; lang: Lang; setLang: (v: Lang) => void }
const DocsCtx = createContext<Ctx>({ host: '', setHost: () => {}, lang: 'curl', setLang: () => {} })
export const useDocsConfig = () => useContext(DocsCtx)

/** Holds the reader's own host and preferred language, remembered across visits. */
export function DocsConfig({ children }: { children: ReactNode }) {
  const [host, setHost] = useState('')
  const [lang, setLang] = useState<Lang>('curl')

  useEffect(() => {
    try {
      const v = localStorage.getItem(HOST_KEY)
      if (v) setHost(v)
      const l = localStorage.getItem(LANG_KEY)
      if (l === 'curl' || l === 'js') setLang(l)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (host) localStorage.setItem(HOST_KEY, host)
      else localStorage.removeItem(HOST_KEY)
    } catch {}
  }, [host])

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {}
  }, [lang])

  return <DocsCtx.Provider value={{ host, setHost, lang, setLang }}>{children}</DocsCtx.Provider>
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

function LangTab({ value, label }: { value: Lang; label: string }) {
  const { lang, setLang } = useDocsConfig()
  return (
    <button
      onClick={() => setLang(value)}
      className={cn(
        'ledger rounded-[2px] px-2 py-0.5 text-[11px] transition-colors',
        lang === value ? 'bg-patch/15 text-patch' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

/** A code sample: swaps the host placeholder, and offers a fetch variant. */
export function DocsCode({ code, js }: { code: string; js?: string }) {
  const { host, lang } = useDocsConfig()
  const [copied, setCopied] = useState(false)
  const source = js && lang === 'js' ? js : code
  const resolved = host ? source.replace(PLACEHOLDER, host) : source

  const parts: ReactNode[] = []
  if (host) {
    const segs = source.split(PLACEHOLDER)
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
    parts.push(source)
  }

  return (
    <div className="group relative">
      {js && (
        <div className="absolute left-3 top-2.5 z-10 flex gap-1">
          <LangTab value="curl" label="curl" />
          <LangTab value="js" label="fetch" />
        </div>
      )}
      <pre
        className={cn(
          'ledger overflow-x-auto rounded border border-border bg-card p-4 text-xs leading-relaxed text-foreground',
          js && 'pt-10',
        )}
      >
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
