'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useFavorites } from '@/hooks/useFavorites'
import { ListingGrid } from '@/components/listings/ListingGrid'

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <SavedListings />
    </ProtectedRoute>
  )
}

function SavedListings() {
  const { data: saved, isLoading } = useFavorites()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Saved Listings</h1>
      <ListingGrid
        listings={saved ?? []}
        isLoading={isLoading}
        emptyMessage="No saved listings yet. Tap the heart on any listing to save it."
      />
    </div>
  )
}
