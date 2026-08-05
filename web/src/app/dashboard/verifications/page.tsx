'use client'

import Link from 'next/link'
import { CheckCircle, Star } from 'lucide-react'
import { useAllListings, useVerifyListing, useFeatureListing } from '@/hooks/useAdminListings'
import { formatPrice } from '@/lib/listingUtils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Badge } from '@/components/ui/badge'

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

  const unverified = all?.filter((l) => !l.is_verified && l.status === 'ACTIVE') ?? []

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
                  onClick={() => verify.mutate(l.id)}
                  disabled={verify.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verify
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => feature.mutate(l.id)}
                  disabled={feature.isPending}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {l.is_featured ? 'Unfeature' : 'Feature'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
