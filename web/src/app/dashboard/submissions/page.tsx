'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSubmissions, useUpdateSubmission, useApproveSubmission } from '@/hooks/useSubmissions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SubmissionStatus } from '@/types/submission'

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  CONTACTED: { label: 'Contacted', variant: 'default' },
  APPROVED: { label: 'Live', variant: 'outline' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

const TABS: SubmissionStatus[] = ['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED']

export default function SubmissionsPage() {
  const [tab, setTab] = useState<SubmissionStatus | 'ALL'>('ALL')
  const { data, isLoading } = useSubmissions(tab === 'ALL' ? undefined : tab)
  const update = useUpdateSubmission()
  const approve = useApproveSubmission()

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-bold">Submission Queue</h1>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {(['ALL', ...TABS] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'ALL' ? 'All' : STATUS_CONFIG[t].label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📬</p>
          <p className="text-muted-foreground">No submissions found.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((s) => {
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
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
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
                      onClick={() => approve.mutate(s.id)}
                      disabled={approve.isPending}
                    >
                      Approve → Publish
                    </Button>
                  )}
                  {s.status !== 'REJECTED' && s.status !== 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 text-destructive border-destructive/30"
                      onClick={() => update.mutate({ id: s.id, status: 'REJECTED' })}
                      disabled={update.isPending}
                    >
                      Reject
                    </Button>
                  )}
                  {s.owner_whatsapp && (
                    <a
                      href={`https://wa.me/${s.owner_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, we received your listing request on EthioListings.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
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
    </div>
  )
}
