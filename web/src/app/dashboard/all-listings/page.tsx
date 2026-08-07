'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Eye, Star } from 'lucide-react'
import { useAllListings, useVerifyListing, useFeatureListing } from '@/hooks/useAdminListings'
import { formatPrice } from '@/lib/listingUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type PendingAction = {
  id: string
  title: string
  description: string
  confirmLabel: string
  variant: 'default' | 'warning'
  action: () => void
}

export default function AllListingsPage() {
  return (
    <RoleGuard roles={['ADMIN']}>
      <AllListingsContent />
    </RoleGuard>
  )
}

function AllListingsContent() {
  const { data: listings, isLoading } = useAllListings()
  const verify = useVerifyListing()
  const feature = useFeatureListing()
  const [pending, setPending] = useState<PendingAction | null>(null)

  function confirmVerify(l: { id: string; title: string; is_verified: boolean }) {
    setPending({
      id: l.id,
      title: l.is_verified ? 'Remove verification?' : 'Verify this listing?',
      description: l.is_verified
        ? `"${l.title}" will lose its verified badge and buyers will no longer see it as verified.`
        : `"${l.title}" will receive a verified badge visible to all buyers.`,
      confirmLabel: l.is_verified ? 'Remove verification' : 'Verify listing',
      variant: l.is_verified ? 'warning' : 'default',
      action: () => verify.mutate(l.id),
    })
  }

  function confirmFeature(l: { id: string; title: string; is_featured: boolean }) {
    setPending({
      id: l.id,
      title: l.is_featured ? 'Remove from featured?' : 'Feature this listing?',
      description: l.is_featured
        ? `"${l.title}" will be removed from the featured section on the homepage.`
        : `"${l.title}" will appear in the featured section on the homepage.`,
      confirmLabel: l.is_featured ? 'Remove featured' : 'Feature listing',
      variant: 'default',
      action: () => feature.mutate(l.id),
    })
  }

  const isMutating = verify.isPending || feature.isPending

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">All Listings</h1>
        <p className="text-sm text-muted-foreground">{listings?.length ?? 0} total</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {listings && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {listings.map((l) => (
            <div key={l.id} className="p-4 bg-card hover:bg-muted/30 transition-colors">
              {/* Row 1: title + status */}
              <div className="flex items-start gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium truncate">{l.title}</p>
                    {l.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    {l.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l.category} · {l.listing_type} · {l.location?.region ?? '—'}
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-primary mt-1">
                    {formatPrice(l.price, l.price_unit)}
                  </p>
                </div>
                <Badge variant={l.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                  {l.status}
                </Badge>
              </div>

              {/* Row 2: actions */}
              <div className="flex flex-wrap items-center gap-1 mt-3">
                <Link href={`/listings/${l.id}`} target="_blank">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-xs ${l.is_verified ? 'text-emerald-700' : ''}`}
                  onClick={() => confirmVerify(l)}
                >
                  {l.is_verified ? '✓ Verified' : 'Verify'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-xs ${l.is_featured ? 'text-amber-600' : ''}`}
                  onClick={() => confirmFeature(l)}
                >
                  {l.is_featured ? '★ Featured' : 'Feature'}
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
