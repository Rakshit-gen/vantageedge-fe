'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'
import { tenantApi } from '@/lib/api/resources'
import { qk, useOptimisticMutation } from '@/lib/hooks/use-resource'
import { useTenant } from '@/lib/contexts/tenant-context'
import type { Tenant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { InlineEdit } from '@/components/inline-edit'
import { copyText, formatDate } from '@/lib/utils'

export default function ExchangePage() {
  const { tenant, isLoading } = useTenant()
  const { user } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState('')
  const [copied, setCopied] = useState(false)

  const rename = useOptimisticMutation<string, Tenant, Tenant>({
    mutationFn: (name) => tenantApi.update({ name }),
    listKey: qk.tenant,
    optimistic: (cur, name) => (cur ? { ...cur, name } : cur),
    success: 'Renamed',
  })

  const destroy = useOptimisticMutation<void>({
    mutationFn: () => tenantApi.remove(),
    listKey: qk.tenant,
    success: 'Tenant deleted',
  })

  return (
    <div className="max-w-2xl space-y-10">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">The exchange</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your tenant. It was provisioned automatically the first time you signed in.
        </p>
      </header>

      {isLoading || !tenant ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <section className="space-y-4">
            <div className="eyebrow">identity</div>
            <dl className="ledger divide-y divide-border/70 rounded border border-border">
              <Field label="Name">
                <InlineEdit
                  value={tenant.name}
                  onCommit={(v) => rename.mutate(v)}
                  display={(v) => <span className="text-foreground">{v}</span>}
                />
              </Field>
              <Field label="Address">
                <span className="text-muted-foreground">{tenant.subdomain}.vantageedge.dev</span>
              </Field>
              <Field label="Status">
                <span className="flex items-center gap-2">
                  <span className="lamp lamp-on" />
                  {tenant.status}
                </span>
              </Field>
              <Field label="Tenant ID">
                <span className="flex items-center gap-2">
                  <code className="break-all text-foreground">{tenant.id}</code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      if (await copyText(tenant.id)) {
                        setCopied(true)
                        toast.success('Copied')
                        setTimeout(() => setCopied(false), 1500)
                      }
                    }}
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </span>
              </Field>
              <Field label="Created">
                <span className="text-muted-foreground">{formatDate(tenant.created_at)}</span>
              </Field>
            </dl>
          </section>

          <section className="space-y-4">
            <div className="eyebrow">operator</div>
            <dl className="ledger divide-y divide-border/70 rounded border border-border">
              <Field label="Signed in as">
                <span className="text-foreground">{user?.primaryEmailAddress?.emailAddress ?? '—'}</span>
              </Field>
              <Field label="Profile">
                <span className="text-muted-foreground">
                  Name, email and 2FA are managed in your Clerk account.
                </span>
              </Field>
            </dl>
          </section>

          <section className="space-y-4">
            <div className="eyebrow">danger</div>
            <div className="space-y-3 rounded border border-destructive/40 p-4">
              <p className="text-sm text-foreground">Delete this tenant</p>
              <p className="text-sm text-muted-foreground">
                Removes every origin, route and key, and stops the gateway for{' '}
                <span className="font-mono">{tenant.subdomain}.vantageedge.dev</span>. There is no undo.
              </p>
              <Label className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Type <span className="text-foreground">{tenant.subdomain}</span> to confirm
              </Label>
              <div className="flex gap-2">
                <Input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={tenant.subdomain}
                  className="max-w-xs"
                />
                <Button
                  variant="destructive"
                  disabled={confirm !== tenant.subdomain || destroy.isPending}
                  onClick={() =>
                    destroy.mutate(undefined, {
                      onSuccess: () => {
                        qc.clear()
                        signOut(() => router.push('/'))
                      },
                    })
                  }
                >
                  {destroy.isPending ? 'Deleting…' : 'Delete tenant'}
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 text-sm">
      <dt className="w-28 shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}
