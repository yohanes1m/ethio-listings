'use client'

import Link from 'next/link'
import { CheckCircle, Eye } from 'lucide-react'
import { useAllListings, useVerifyListing, useFeatureListing } from '@/hooks/useAdminListings'
import { formatPrice } from '@/lib/listingUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/auth/RoleGuard'

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

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">All Listings</h1>
        <p className="text-sm text-muted-foreground">{listings?.length ?? 0} total</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )}

      {listings && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-4 bg-card hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  {l.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{l.category} · {l.listing_type} · {l.location?.region}</p>
              </div>

              <span className="text-sm font-semibold tabular-nums hidden sm:block">
                {formatPrice(l.price, l.price_unit)}
              </span>

              <Badge variant={l.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                {l.status}
              </Badge>

              <div className="flex items-center gap-1">
                <Link href={`/listings/${l.id}`} target="_blank">
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-7"
                  onClick={() => verify.mutate(l.id)}
                  disabled={verify.isPending}
                >
                  {l.is_verified ? 'Unverify' : 'Verify'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-7"
                  onClick={() => feature.mutate(l.id)}
                  disabled={feature.isPending}
                >
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
