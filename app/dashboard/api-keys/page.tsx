'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { apiKeysApi } from '@/lib/api/resources'
import { qk, useOptimisticMutation } from '@/lib/hooks/use-resource'
import { useCommandMenu } from '@/components/command-menu'
import type { APIKey, APIKeyWithSecret } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn, copyText, formatDate, relativeTime } from '@/lib/utils'

const SCOPES = ['read', 'write', 'admin'] as const

export default function KeysPage() {
  const [genOpen, setGenOpen] = useState(false)
  const [issued, setIssued] = useState<APIKeyWithSecret | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<APIKey | null>(null)
  const cmd = useCommandMenu()

  const { data: keys = [], isLoading } = useQuery({ queryKey: qk.apiKeys, queryFn: apiKeysApi.list })

  useEffect(() => cmd.register('keys', { 'Generate API key': () => setGenOpen(true) }), [cmd])

  const create = useOptimisticMutation<
    { name: string; scopes: string[]; expires_at?: string },
    APIKeyWithSecret
  >({
    mutationFn: (body) => apiKeysApi.create(body),
    listKey: qk.apiKeys,
    success: 'Key generated',
  })

  const remove = useOptimisticMutation<string, void, APIKey[]>({
    mutationFn: (id) => apiKeysApi.remove(id),
    listKey: qk.apiKeys,
    optimistic: (cur, id) => cur?.filter((k) => k.id !== id),
    success: 'Key revoked',
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            API keys for callers that can't carry a JWT: services, scripts, cron. The secret is shown once.
          </p>
        </div>
        <Button onClick={() => setGenOpen(true)}>
          <Plus /> Generate key
        </Button>
      </header>

      <div className="panel">
        {isLoading ? (
          <Skeleton className="m-4 h-56" />
        ) : keys.length === 0 ? (
          <div className="grid place-content-center gap-2 py-16 text-center">
            <p className="text-sm text-foreground">No keys issued.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Generate one for any caller that authenticates with a key instead of a session token.
            </p>
            <Button variant="outline" size="sm" className="mx-auto mt-2" onClick={() => setGenOpen(true)}>
              <Plus /> Generate key
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead className="w-20 text-right">Calls</TableHead>
                <TableHead className="w-32">Last used</TableHead>
                <TableHead className="w-28">Expires</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => {
                const expired = k.expires_at && new Date(k.expires_at) < new Date()
                return (
                  <TableRow key={k.id} className={cn(!k.is_active && 'opacity-55')}>
                    <TableCell className="text-foreground">{k.name}</TableCell>
                    <TableCell className="text-muted-foreground">{k.key_prefix}…</TableCell>
                    <TableCell>
                      <span className="flex gap-1">
                        {k.scopes.map((s) => (
                          <Badge key={s} variant="outline">
                            {s}
                          </Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{k.usage_count}</TableCell>
                    <TableCell className="text-muted-foreground">{relativeTime(k.last_used_at)}</TableCell>
                    <TableCell className={cn('tabular-nums', expired ? 'text-destructive' : 'text-muted-foreground')}>
                      {k.expires_at ? formatDate(k.expires_at) : 'never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(k)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <GenerateDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        pending={create.isPending}
        onSubmit={(body) =>
          create.mutate(body, {
            onSuccess: (key) => {
              setGenOpen(false)
              setIssued(key)
            },
          })
        }
      />

      <RevealDialog issued={issued} onClose={() => setIssued(null)} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Any caller using this key starts getting 401s immediately. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) remove.mutate(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function GenerateDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (body: { name: string; scopes: string[]; expires_at?: string }) => void
  pending: boolean
}) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['read'])
  const [expires, setExpires] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setScopes(['read'])
      setExpires('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Generate key</DialogTitle>
          <DialogDescription>You'll see the secret once, right after this.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit({
              name,
              scopes,
              // <input type="date"> gives YYYY-MM-DD; the backend wants RFC3339.
              expires_at: expires ? `${expires}T23:59:59Z` : undefined,
            })
          }}
        >
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ci-deploy" required />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Scopes</Label>
            <div className="flex gap-1.5">
              {SCOPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
                  }
                  className={cn(
                    'rounded border px-2.5 py-1 font-mono text-[11px] transition-colors',
                    scopes.includes(s)
                      ? 'border-patch bg-patch/10 text-patch'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Expires (optional)
            </Label>
            <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name || scopes.length === 0}>
              {pending ? 'Generating…' : 'Generate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RevealDialog({ issued, onClose }: { issued: APIKeyWithSecret | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [issued])

  return (
    <Dialog open={!!issued} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{issued?.name}</DialogTitle>
          <DialogDescription>
            Copy this now. It is not stored and will not be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded border border-border bg-background p-3">
          <code className="ledger flex-1 break-all text-sm text-foreground">{issued?.key}</code>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={async () => {
              if (issued && (await copyText(issued.key))) {
                setCopied(true)
                toast.success('Key copied')
                setTimeout(() => setCopied(false), 1500)
              }
            }}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
