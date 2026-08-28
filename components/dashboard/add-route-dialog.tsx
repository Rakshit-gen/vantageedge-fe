'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { originsApi, routesApi, type RouteInput } from '@/lib/api/resources'
import { qk, useOptimisticMutation } from '@/lib/hooks/use-resource'
import type { AuthMode, Route } from '@/lib/types'
import { cn } from '@/lib/utils'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
const AUTH_MODES: { value: AuthMode; label: string }[] = [
  { value: 'public', label: 'Open (no auth)' },
  { value: 'jwt_required', label: 'JWT required' },
  { value: 'apikey_required', label: 'API key required' },
  { value: 'both', label: 'JWT and API key' },
]

const blank = (originId: string): RouteInput => ({
  origin_id: originId,
  name: '',
  path_pattern: '',
  methods: ['GET'],
  priority: 0,
  auth_mode: 'public',
  is_active: true,
  rate_limit_enabled: false,
  rate_limit_requests_per_second: 100,
  rate_limit_burst: 20,
  rate_limit_key_strategy: 'ip',
  cache_enabled: false,
  cache_ttl_seconds: 60,
  cache_key_pattern: '',
  timeout_seconds: 30,
  retry_attempts: 0,
})

export function AddRouteDialog({
  open,
  onOpenChange,
  route,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: Route | null
}) {
  const { data: origins = [] } = useQuery({ queryKey: qk.origins, queryFn: originsApi.list })
  const [form, setForm] = useState<RouteInput>(blank(''))

  useEffect(() => {
    if (!open) return
    if (route) {
      setForm({
        origin_id: route.origin_id,
        name: route.name,
        path_pattern: route.path_pattern,
        methods: route.methods,
        priority: route.priority,
        auth_mode: route.auth_mode,
        is_active: route.is_active,
        rate_limit_enabled: route.rate_limit_enabled,
        rate_limit_requests_per_second: route.rate_limit_requests_per_second,
        rate_limit_burst: route.rate_limit_burst,
        rate_limit_key_strategy: route.rate_limit_key_strategy || 'ip',
        cache_enabled: route.cache_enabled,
        cache_ttl_seconds: route.cache_ttl_seconds,
        cache_key_pattern: route.cache_key_pattern || '',
        timeout_seconds: route.timeout_seconds,
        retry_attempts: route.retry_attempts,
      })
    } else {
      setForm(blank(origins[0]?.id ?? ''))
    }
  }, [route, open, origins])

  const mutation = useOptimisticMutation<RouteInput>({
    mutationFn: (body) => (route ? routesApi.update(route.id, body) : routesApi.create(body)),
    listKey: qk.routes,
    success: route ? 'Route updated' : 'Route patched in',
  })

  const set = <K extends keyof RouteInput>(k: K, v: RouteInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const toggleMethod = (m: string) =>
    set('methods', form.methods.includes(m) ? form.methods.filter((x) => x !== m) : [...form.methods, m])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{route ? 'Edit route' : 'Patch a route'}</DialogTitle>
          <DialogDescription>
            A path pattern the exchange watches for, and the origin it hands matching requests to.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate(form, { onSuccess: () => onOpenChange(false) })
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="orders" required />
            </Field>
            <Field label="Origin">
              <Select value={form.origin_id} onValueChange={(v) => set('origin_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={origins.length ? 'Choose an origin' : 'Add an origin first'} />
                </SelectTrigger>
                <SelectContent>
                  {origins.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Path pattern">
            <Input
              className="font-mono"
              value={form.path_pattern}
              onChange={(e) => set('path_pattern', e.target.value)}
              placeholder="/api/orders/*"
              required
            />
          </Field>

          <Field label="Methods">
            <div className="flex flex-wrap gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMethod(m)}
                  className={cn(
                    'rounded border px-2 py-1 font-mono text-[11px] transition-colors',
                    form.methods.includes(m)
                      ? 'border-patch bg-patch/10 text-patch'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Auth">
              <Select value={form.auth_mode} onValueChange={(v) => set('auth_mode', v as AuthMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_MODES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => set('priority', Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <Toggle
            label="Active"
            hint="Inactive routes are ignored by the exchange."
            checked={form.is_active}
            onChange={(v) => set('is_active', v)}
          />

          <Toggle
            label="Rate limit"
            hint="Token bucket, refilled per second."
            checked={form.rate_limit_enabled}
            onChange={(v) => set('rate_limit_enabled', v)}
          />
          {form.rate_limit_enabled && (
            <div className="grid grid-cols-2 gap-3 pl-1">
              <Field label="Req / sec">
                <Input
                  type="number"
                  value={form.rate_limit_requests_per_second}
                  onChange={(e) => set('rate_limit_requests_per_second', Number(e.target.value) || 1)}
                />
              </Field>
              <Field label="Burst">
                <Input
                  type="number"
                  value={form.rate_limit_burst}
                  onChange={(e) => set('rate_limit_burst', Number(e.target.value) || 1)}
                />
              </Field>
            </div>
          )}

          <Toggle
            label="Cache responses"
            hint="Successful GETs held in Redis for the TTL."
            checked={form.cache_enabled}
            onChange={(v) => set('cache_enabled', v)}
          />
          {form.cache_enabled && (
            <div className="pl-1">
              <Field label="TTL (seconds)">
                <Input
                  type="number"
                  value={form.cache_ttl_seconds}
                  onChange={(e) => set('cache_ttl_seconds', Number(e.target.value) || 1)}
                />
              </Field>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.name || !form.path_pattern || !form.origin_id || form.methods.length === 0}
            >
              {mutation.isPending ? 'Saving…' : route ? 'Save' : 'Patch route'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="text-sm text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </label>
  )
}
