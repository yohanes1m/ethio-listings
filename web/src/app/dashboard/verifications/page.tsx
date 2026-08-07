'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Star } from 'lucide-react'
import { useAllListings, useVerifyListing, useFeatureListing } from '@/hooks/useAdminListings'
import { formatPrice } from '@/lib/listingUtils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type PendingAction = {
  title: string
  description: string
  confirmLabel: string
  variant: 'default' | 'warning'
  action: () => void
}

export default function VerificationsPage() {
  return (
    <RoleGuard roles={['ADMIN']}>
      <VerificationsContent />
    </RoleGuard>
  )
}

function VerificationsContent() {
  const { data: all, isLoading } = useAllListings()
  const verify = useVerifyListing()
  const feature = useFeatureListing()
  const [pending, setPending] = useState<PendingAction | null>(null)

  const unverified = all?.filter((l) => !l.is_verified && l.status === 'ACTIVE') ?? []

  const isMutating = verify.isPending || feature.isPending

  function confirmVerify(l: { id: string; title: string }) {
    setPending({
      title: 'Verify this listing?',
      description: `"${l.title}" will receive a verified badge visible to all buyers.`,
      confirmLabel: 'Verify listing',
      variant: 'default',
      action: () => verify.mutate(l.id),
    })
  }

  function confirmFeature(l: { id: string; title: string; is_featured: boolean }) {
    setPending({
      title: l.is_featured ? 'Remove from featured?' : 'Feature this listing?',
      description: l.is_featured
        ? `"${l.title}" will be removed from the featured section on the homepage.`
        : `"${l.title}" will appear in the featured section on the homepage.`,
      confirmLabel: l.is_featured ? 'Remove featured' : 'Feature listing',
      variant: 'default',
      action: () => feature.mutate(l.id),
    })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Verification Queue</h1>
        <p className="text-sm text-muted-foreground">{unverified.length} pending</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {!isLoading && unverified.length === 0 && (
        <div className="text-center py-20">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-medium">All listings are verified!</p>
          <p className="text-sm text-muted-foreground">Nothing in the queue right now.</p>
        </div>
      )}

      {unverified.length > 0 && (
        <div className="space-y-3">
          {unverified.map((l) => (
            <div key={l.id} className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l.category} · {l.listing_type} · {l.location?.region}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1 tabular-nums">
                    {formatPrice(l.price, l.price_unit)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {l.is_featured && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">
                      <Star className="w-3 h-3 mr-1" />Featured
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/listings/${l.id}`} target="_blank">
                  <Button variant="outline" size="sm" className="text-xs h-7">Preview</Button>
                </Link>
                <Button
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => confirmVerify(l)}
                  disabled={isMutating}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verify
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => confirmFeature(l)}
                  disabled={isMutating}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {l.is_featured ? 'Unfeature' : 'Feature'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => { if (!open) setPending(null) }}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmLabel={pending?.confirmLabel ?? 'Confirm'}
        variant={pending?.variant ?? 'default'}
        isLoading={isMutating}
        onConfirm={() => {
          pending?.action()
          setPending(null)
        }}
      />
    </div>
  )
}
