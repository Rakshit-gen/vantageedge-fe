'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { originsApi, type OriginInput } from '@/lib/api/resources'
import { qk, useOptimisticMutation } from '@/lib/hooks/use-resource'
import type { Origin } from '@/lib/types'

const BLANK: OriginInput = {
  name: '',
  url: '',
  health_check_path: '/health',
  health_check_interval: 30,
  timeout_seconds: 5,
  max_retries: 3,
  weight: 1,
}

export function AddOriginDialog({
  open,
  onOpenChange,
  origin,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin?: Origin | null
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<OriginInput>(BLANK)

  useEffect(() => {
    if (!open) return
    setForm(
      origin
        ? {
            name: origin.name,
            url: origin.url,
            health_check_path: origin.health_check_path,
            health_check_interval: origin.health_check_interval,
            timeout_seconds: origin.timeout_seconds,
            max_retries: origin.max_retries,
            weight: origin.weight,
          }
        : BLANK,
    )
  }, [origin, open])

  const mutation = useOptimisticMutation<OriginInput>({
    mutationFn: (body) => (origin ? originsApi.update(origin.id, body) : originsApi.create(body)),
    listKey: qk.origins,
    success: origin ? 'Origin updated' : 'Origin added to the pool',
    invalidate: [qk.origins, qk.routes],
  })

  const set = <K extends keyof OriginInput>(k: K, v: OriginInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{origin ? 'Edit origin' : 'New origin'}</DialogTitle>
          <DialogDescription>
            A backend the exchange can forward to. Health checks decide whether it stays in rotation.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate(form, { onSuccess: () => onOpenChange(false) })
          }}
        >
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="orders-api" required />
          </Field>
          <Field label="URL">
            <Input
              type="url"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://orders.internal.example.com"
              required
            />
          </Field>
          <Field label="Health check path">
            <Input
              value={form.health_check_path}
              onChange={(e) => set('health_check_path', e.target.value)}
              placeholder="/health"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Weight">
              <Input
                type="number"
                min={1}
                value={form.weight}
                onChange={(e) => set('weight', Number(e.target.value) || 1)}
              />
            </Field>
            <Field label="Timeout (s)">
              <Input
                type="number"
                min={1}
                value={form.timeout_seconds}
                onChange={(e) => set('timeout_seconds', Number(e.target.value) || 5)}
              />
            </Field>
            <Field label="Retries">
              <Input
                type="number"
                min={0}
                value={form.max_retries}
                onChange={(e) => set('max_retries', Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.name || !form.url}>
              {mutation.isPending ? 'Saving…' : origin ? 'Save' : 'Add origin'}
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
