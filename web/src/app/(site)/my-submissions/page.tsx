'use client'

import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useMySubmissions } from '@/hooks/useSubmissions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SubmissionStatus } from '@/types/submission'

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  CONTACTED: { label: 'Contacted', variant: 'default' },
  APPROVED: { label: 'Live', variant: 'outline' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

export default function MySubmissionsPage() {
  return (
    <ProtectedRoute>
      <SubmissionsList />
    </ProtectedRoute>
  )
}

function SubmissionsList() {
  const { data, isLoading } = useMySubmissions()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">የኔ ጥያቄዎች</h1>
        <Link href="/submit">
          <Button size="sm">+ New Request</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground mb-4">No submissions yet.</p>
          <Link href="/submit">
            <Button>Submit your first listing</Button>
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((submission) => {
            const config = STATUS_CONFIG[submission.status]
            return (
              <div
                key={submission.id}
                className="rounded-xl border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">
                      {submission.category.toLowerCase()} · {submission.listing_type}
                    </span>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {[submission.region, submission.woreda].filter(Boolean).join(', ')}
                </p>

                {submission.owner_message && (
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {submission.owner_message}
                  </div>
                )}

                {submission.listing && (
                  <Link href={`/listings/${submission.listing}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      View Live Listing →
                    </Button>
                  </Link>
                )}

                <p className="text-[10px] text-muted-foreground">
                  Submitted {new Date(submission.created_at).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
