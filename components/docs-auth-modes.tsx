'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDocsConfig } from './docs-config'

const MODES = [
  { key: 'public', jwt: false, apikey: false, blurb: 'No authentication. Anyone can call the route.' },
  { key: 'jwt_required', jwt: true, apikey: false, blurb: 'A valid Clerk JWT must be present.' },
  { key: 'apikey_required', jwt: false, apikey: true, blurb: 'A valid X-API-Key must be present.' },
  { key: 'both', jwt: true, apikey: true, blurb: 'Both a JWT and an X-API-Key must be present.' },
] as const

export function AuthModes() {
  const [active, setActive] = useState<(typeof MODES)[number]['key']>('jwt_required')
  const { host } = useDocsConfig()
  const base = host || '<host>'
  const mode = MODES.find((m) => m.key === active)!

  return (
    <div className="not-prose overflow-hidden rounded border border-border sm:grid sm:grid-cols-[170px_1fr]">
      <div className="ledger flex flex-row overflow-x-auto border-b border-border sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setActive(m.key)}
            className={cn(
              'shrink-0 border-transparent px-3 py-2 text-left text-xs transition-colors sm:border-l-2',
              m.key === active
                ? 'bg-accent/40 text-patch sm:border-patch'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m.key}
          </button>
        ))}
      </div>

      <div className="p-4">
        <p className="text-xs text-muted-foreground">{mode.blurb}</p>
        <pre className="ledger mt-3 overflow-x-auto text-[11px] leading-relaxed text-foreground">
          <code>
            {`curl https://${base}/api/v1/routes`}
            {mode.jwt && (
              <>
                {' \\\n  '}
                <span className="text-patch">-H &quot;Authorization: Bearer $JWT&quot;</span>
                <span className="text-muted-foreground">   # required</span>
              </>
            )}
            {mode.apikey && (
              <>
                {' \\\n  '}
                <span className="text-patch">-H &quot;X-API-Key: ve_live_...&quot;</span>
                <span className="text-muted-foreground">   # required</span>
              </>
            )}
          </code>
        </pre>
        <p className="ledger mt-3 text-[11px]">
          {mode.jwt || mode.apikey ? (
            <span className="text-warning">missing {mode.jwt && mode.apikey ? 'either' : 'it'} → 401 Unauthorized</span>
          ) : (
            <span className="text-lamp">no header needed → 200</span>
          )}
        </p>
      </div>
    </div>
  )
}
