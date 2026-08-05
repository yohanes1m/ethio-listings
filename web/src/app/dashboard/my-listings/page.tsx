'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PlusCircle, Pencil, Eye, CheckCircle } from 'lucide-react'
import { useMyListings } from '@/hooks/useListings'
import { useVerifyListing, useFeatureListing } from '@/hooks/useAdminListings'
import { formatPrice } from '@/lib/listingUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { CloseDealModal } from '@/components/dashboard/CloseDealModal'
import type { Listing } from '@/types/listing'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  SOLD: 'outline',
  RENTED: 'outline',
  EXPIRED: 'destructive',
}

export default function MyListingsPage() {
  const { data: listings, isLoading } = useMyListings()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const verify = useVerifyListing()
  const feature = useFeatureListing()
  const [closingListing, setClosingListing] = useState<Listing | null>(null)

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Listings</h1>
        <Link href="/dashboard/add">
          <Button size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Listing
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {!isLoading && !listings?.length && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground mb-4">No listings yet.</p>
          <Link href="/dashboard/add">
            <Button>Add your first listing</Button>
          </Link>
        </div>
      )}

      {listings && listings.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  {l.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  {l.is_featured && <span className="text-[10px] text-amber-600 font-semibold">FEATURED</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {l.category} · {l.listing_type} · {l.view_count} views
                </p>
              </div>

              {/* Price */}
              <div className="hidden sm:block text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums">{formatPrice(l.price, l.price_unit)}</p>
              </div>

              {/* Status */}
              <Badge variant={STATUS_VARIANT[l.status] ?? 'secondary'} className="shrink-0 text-[10px]">
                {l.status}
              </Badge>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/listings/${l.id}`} target="_blank">
                  <Button variant="ghost" size="icon" className="w-8 h-8" title="View">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href={`/dashboard/edit/${l.id}`}>
                  <Button variant="ghost" size="icon" className="w-8 h-8" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                {isAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-7"
                      onClick={() => verify.mutate(l.id)}
                      title={l.is_verified ? 'Unverify' : 'Verify'}
                    >
                      {l.is_verified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-7"
                      onClick={() => feature.mutate(l.id)}
                    >
                      {l.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                  </>
                )}
                {l.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-7"
                    onClick={() => setClosingListing(l)}
                  >
                    Close Deal
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {closingListing && (
        <CloseDealModal
          listing={closingListing}
          onClose={() => setClosingListing(null)}
        />
      )}
    </div>
  )
}
