'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Inbox, X } from 'lucide-react'
import { useSubmissions, useUpdateSubmission, useApproveSubmission } from '@/hooks/useSubmissions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Pagination } from '@/components/ui/pagination'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { SubmissionStatus } from '@/types/submission'

const PAGE_SIZE = 20

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  CONTACTED: { label: 'Contacted', variant: 'default' },
  APPROVED: { label: 'Live', variant: 'outline' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

const TABS: SubmissionStatus[] = ['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED']

export default function SubmissionsPage() {
  const [params, setParams] = useState({
    page: 1,
    status: '' as SubmissionStatus | '',
    q: '',
    category: '',
    listing_type: '',
  })
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const { data, isLoading } = useSubmissions(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== 0))
  )
  const update = useUpdateSubmission()
  const approve = useApproveSubmission()

  function setParam(key: string, value: string | number) {
    setParams((p) => ({ ...p, [key]: value, page: 1 }))
  }

  const hasExtraFilters = params.q !== '' || params.category !== '' || params.listing_type !== ''

  function clearFilters() {
    setParams((p) => ({ ...p, q: '', category: '', listing_type: '', page: 1 }))
  }

  function handleReject(id: string) {
    update.mutate(
      { id, status: 'REJECTED', owner_message: rejectMessage || undefined },
      { onSuccess: () => { setRejectingId(null); setRejectMessage('') } },
    )
  }

  const submissions = data?.results ?? []
  const total = data?.count ?? 0

  const approvingSubmission = approvingId ? submissions.find((s) => s.id === approvingId) : null

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-xl font-bold">Submission Queue</h1>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {(['ALL', ...TABS] as const).map((t) => (
          <button
            key={t}
            onClick={() => setParam('status', t === 'ALL' ? '' : t)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              (t === 'ALL' ? params.status === '' : params.status === t)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'ALL' ? 'All' : STATUS_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by region or owner…"
          value={params.q}
          onChange={(e) => setParam('q', e.target.value)}
          className="h-8 text-xs w-52 min-w-[160px]"
        />
        <Select value={params.category} onValueChange={(v) => setParam('category', v)}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOUSE">House</SelectItem>
            <SelectItem value="LAND">Land</SelectItem>
            <SelectItem value="CAR">Car</SelectItem>
            <SelectItem value="MACHINE">Machine</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.listing_type} onValueChange={(v) => setParam('listing_type', v)}>
          <SelectTrigger className="h-8 text-xs w-28">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SALE">For Sale</SelectItem>
            <SelectItem value="RENT">For Rent</SelectItem>
          </SelectContent>
        </Select>
        {hasExtraFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={clearFilters}>
            <X className="w-3.5 h-3.5 mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? 'No submissions found.'
            : `Showing ${Math.min((params.page - 1) * PAGE_SIZE + 1, total)}–${Math.min(params.page * PAGE_SIZE, total)} of ${total}`}
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {!isLoading && submissions.length === 0 && (
        <div className="text-center py-16">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No submissions found.</p>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((s) => {
            const cfg = STATUS_CONFIG[s.status]
            return (
              <div key={s.id} className="rounded-xl border border-border p-4 space-y-3 bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {s.category.toLowerCase()} · {s.listing_type} · {s.region}{s.woreda ? `, ${s.woreda}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(s.created_at).toLocaleDateString()} · {s.owner_phone}
                    </p>
                    {s.owner_message && (
                      <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{s.owner_message}&rdquo;</p>
                    )}
                  </div>
                  <Badge variant={cfg.variant} className="shrink-0 text-[10px]">{cfg.label}</Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {s.status === 'PENDING' && (
                    <Button
                      size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => update.mutate({ id: s.id, status: 'CONTACTED' })}
                      disabled={update.isPending}
                    >
                      Mark Contacted
                    </Button>
                  )}
                  {(s.status === 'PENDING' || s.status === 'CONTACTED') && (
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setApprovingId(s.id)}
                    >
                      Approve → Publish
                    </Button>
                  )}
                  {s.status !== 'REJECTED' && s.status !== 'APPROVED' && rejectingId !== s.id && (
                    <Button
                      size="sm" variant="outline"
                      className="text-xs h-7 text-destructive border-destructive/30"
                      onClick={() => { setRejectingId(s.id); setRejectMessage('') }}
                    >
                      Reject
                    </Button>
                  )}
                  {rejectingId === s.id && (
                    <div className="w-full space-y-2 pt-1">
                      <Textarea
                        className="text-xs min-h-[60px]"
                        placeholder="Optional message to owner explaining the decline reason…"
                        value={rejectMessage}
                        onChange={(e) => setRejectMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="destructive" className="text-xs h-7"
                          onClick={() => handleReject(s.id)}
                          disabled={update.isPending}
                        >
                          Confirm Reject
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="text-xs h-7"
                          onClick={() => { setRejectingId(null); setRejectMessage('') }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {s.owner_whatsapp && (
                    <a
                      href={`https://wa.me/${s.owner_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, we received your listing request on EthioListings.')}`}
                      target="_blank" rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-600 border-emerald-200">
                        WhatsApp Owner
                      </Button>
                    </a>
                  )}
                  {s.listing && (
                    <Link href={`/listings/${s.listing}`}>
                      <Button size="sm" variant="outline" className="text-xs h-7">View Listing →</Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination
        page={params.page}
        count={total}
        pageSize={PAGE_SIZE}
        onChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
      />

      <ConfirmDialog
        open={!!approvingId}
        onOpenChange={(open) => { if (!open) setApprovingId(null) }}
        title="Approve and publish listing?"
        description={
          approvingSubmission
            ? `A new ${approvingSubmission.category.toLowerCase()} listing (${approvingSubmission.region}) will be created and published immediately as active.`
            : 'A new listing will be created from this submission and published immediately as active.'
        }
        confirmLabel="Approve → Publish"
        variant="default"
        isLoading={approve.isPending}
        onConfirm={() => {
          if (approvingId) approve.mutate(approvingId)
          setApprovingId(null)
        }}
      />
    </div>
  )
}
