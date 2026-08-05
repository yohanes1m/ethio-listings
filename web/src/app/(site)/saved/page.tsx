'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useFavorites } from '@/hooks/useFavorites'
import { usePublicListings } from '@/hooks/useListings'
import { ListingGrid } from '@/components/listings/ListingGrid'

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <SavedListings />
    </ProtectedRoute>
  )
}

function SavedListings() {
  const { data: favorites, isLoading: favsLoading } = useFavorites()
  const listingIds = favorites?.map((f) => f.listing) ?? []

  // Fetch all listings and filter to saved ones (simple approach)
  const { data, isLoading: listingsLoading } = usePublicListings()
  const saved = (data?.results ?? []).filter((l) => listingIds.includes(l.id))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">የተቀመጡ ዝርዝሮች</h1>
      <ListingGrid
        listings={saved}
        isLoading={favsLoading || listingsLoading}
        emptyMessage="No saved listings yet. Tap the heart on any listing to save it."
      />
    </div>
  )
}
