'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import authApiClient from '@/lib/authApiClient'
import { useAuthStore } from '@/store/authStore'
import type { Listing } from '@/types/listing'

export function useFavorites() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => authApiClient.get<Listing[]>('/favorites/').then((r) => r.data),
    enabled: isAuthenticated,
  })
}

export function useToggleFavorite(listingId: string) {
  const queryClient = useQueryClient()
  const { data: favorites } = useFavorites()
  const isSaved = favorites?.some((f) => f.id === listingId) ?? false

  const add = useMutation({
    mutationFn: () =>
      authApiClient.post('/favorites/', { listing_id: listingId }).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const remove = useMutation({
    mutationFn: () => authApiClient.delete(`/favorites/${listingId}/`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  return {
    isSaved,
    toggle: () => (isSaved ? remove.mutate() : add.mutate()),
    isPending: add.isPending || remove.isPending,
  }
}
