'use client'

import { ListingCard } from './ListingCard'
import { ListingGridSkeleton } from './ListingSkeleton'
import type { Listing } from '@/types/listing'

interface Props {
  listings: Listing[]
  isLoading?: boolean
  emptyMessage?: string
}

export function ListingGrid({ listings, isLoading, emptyMessage = 'No listings found.' }: Props) {
  if (isLoading) return <ListingGridSkeleton />

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">🏘️</p>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
