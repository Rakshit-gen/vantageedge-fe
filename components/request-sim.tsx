'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type StageKey = 'ingress' | 'match' | 'auth' | 'throttle' | 'cache' | 'forward' | 'log'

const STAGES: { key: StageKey; label: string }[] = [
  { key: 'ingress', label: 'Ingress' },
  { key: 'match', label: 'Match route' },
  { key: 'auth', label: 'Auth' },
  { key: 'throttle', label: 'Rate limit' },
  { key: 'cache', label: 'Cache' },
  { key: 'forward', label: 'Origin' },
  { key: 'log', label: 'Log' },
]

const PATHS = ['/api/orders/1042', '/api/catalog/items?tag=new', '/api/search?q=boots', '/api/auth/session']

type Verdict = { code: number; ms: number; note: string; tone: 'ok' | 'warn' | 'err' }

export function RequestSim() {
  const [warm, setWarm] = useState(false)
  const [strict, setStrict] = useState(true)
  const [running, setRunning] = useState(false)
  const [active, setActive] = useState<number>(-1)
  const [done, setDone] = useState<Set<StageKey>>(new Set())
  const [skipped, setSkipped] = useState<Set<StageKey>>(new Set())
  const [elapsed, setElapsed] = useState(0)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [path, setPath] = useState(PATHS[0])
  const [reduced, setReduced] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setReduced(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const send = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    const nextPath = PATHS[(PATHS.indexOf(path) + 1) % PATHS.length]
    setPath(nextPath)

    const rateLimited = Math.random() < 0.12
    const authFail = strict && Math.random() < 0.1
    const hit = warm && !rateLimited && !authFail && Math.random() < 0.7

    const plan: { key: StageKey; ms: number; skip?: boolean }[] = [
      { key: 'ingress', ms: 1 },
      { key: 'match', ms: 2 },
      { key: 'auth', ms: strict ? 6 : 1 },
      { key: 'throttle', ms: 1 },
      { key: 'cache', ms: hit ? 3 : 2 },
      { key: 'forward', ms: hit ? 0 : 30 + Math.round(Math.random() * 60), skip: hit },
      { key: 'log', ms: 1 },
    ]

    let stop = plan.length
    let final: Verdict
    if (authFail) {
      stop = 3
      final = { code: 401, ms: 0, note: 'rejected at auth: no valid token', tone: 'err' }
    } else if (rateLimited) {
      stop = 4
      final = { code: 429, ms: 0, note: 'token bucket empty, try again shortly', tone: 'warn' }
    } else if (hit) {
      final = { code: 200, ms: 0, note: 'served from cache, origin untouched', tone: 'ok' }
    } else {
      final = { code: 200, ms: 0, note: 'forwarded to a healthy origin', tone: 'ok' }
    }

    setRunning(true)
    setVerdict(null)
    setDone(new Set())
    setSkipped(new Set())
    setElapsed(0)
    setActive(0)

    if (reduced) {
      const total = plan.slice(0, stop).reduce((s, p) => s + p.ms, 0)
      setDone(new Set(plan.slice(0, stop).map((p) => p.key)))
      setSkipped(new Set(plan.filter((p) => p.skip).map((p) => p.key)))
      setActive(-1)
      setElapsed(total)
      setVerdict({ ...final, ms: total })
      setRunning(false)
      return
    }

    let acc = 0
    let clock = 0
    for (let i = 0; i < stop; i++) {
      const stage = plan[i]
      const at = acc
      timers.current.push(
        setTimeout(() => {
          setActive(i)
          if (stage.skip) setSkipped((s) => new Set(s).add(stage.key))
        }, at * 8),
      )
      clock += stage.ms
      const settleAt = acc + Math.max(stage.ms, 6)
      const shownClock = clock
      timers.current.push(
        setTimeout(() => {
          setDone((d) => new Set(d).add(stage.key))
          setElapsed(shownClock)
        }, settleAt * 8),
      )
      acc = settleAt
    }
    timers.current.push(
      setTimeout(() => {
        setActive(-1)
        setRunning(false)
        setVerdict({ ...final, ms: clock })
      }, acc * 8 + 120),
    )
  }, [warm, strict, reduced, path])

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="eyebrow after:hidden">trace a request</span>
        <div className="flex items-center gap-3">
          <Toggle label="cache warm" on={warm} onClick={() => setWarm((v) => !v)} />
          <Toggle label="auth required" on={strict} onClick={() => setStrict((v) => !v)} />
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
        <ol className="divide-y divide-border/70">
          {STAGES.map((s, i) => {
            const isDone = done.has(s.key)
            const isSkip = skipped.has(s.key)
            const isActive = active === i
            return (
              <li key={s.key} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={cn(
                    'lamp transition-colors',
                    isActive ? 'lamp-warn' : isSkip ? 'bg-border' : isDone ? 'lamp-on' : 'bg-border',
                  )}
                />
                <span className={cn('ledger text-xs', isDone || isActive ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
                {isSkip && <span className="ledger text-[11px] text-muted-foreground">skipped</span>}
                {isActive && <span className="ledger text-[11px] text-warning">…</span>}
              </li>
            )
          })}
        </ol>

        <div className="flex flex-col justify-between gap-4 border-t border-border p-4 sm:border-l sm:border-t-0 sm:w-56">
          <div>
            <div className="ledger text-[11px] text-muted-foreground">GET</div>
            <div className="ledger break-all text-sm text-foreground">{path}</div>
          </div>

          <div className="ledger">
            <div className="text-[11px] text-muted-foreground">elapsed</div>
            <div className="mono-num text-2xl text-foreground">{elapsed} ms</div>
          </div>

          {verdict && (
            <div
              className={cn(
                'ledger rounded border px-2 py-1.5 text-xs',
                verdict.tone === 'ok' && 'border-lamp/40 text-lamp',
                verdict.tone === 'warn' && 'border-warning/40 text-warning',
                verdict.tone === 'err' && 'border-destructive/40 text-destructive',
              )}
            >
              <div className="font-medium">{verdict.code}</div>
              <div className="text-muted-foreground">{verdict.note}</div>
            </div>
          )}

          <button
            onClick={send}
            disabled={running}
            className="rounded bg-patch px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {running ? 'in flight…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[11px] transition-colors',
        on ? 'border-patch/40 bg-patch/10 text-patch' : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      <span className={cn('lamp', on ? 'lamp-on' : 'bg-border')} />
      {label}
    </button>
  )
}
