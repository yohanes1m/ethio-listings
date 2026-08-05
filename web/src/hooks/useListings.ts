'use client'

import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import type { Listing, PaginatedListings, PlatformStats } from '@/types/listing'

interface PublicListingsParams {
  category?: string
  listing_type?: string
  region?: string
  q?: string
  verified?: boolean
  price_min?: number
  price_max?: number
  page?: number
}

export function usePublicListings(params: PublicListingsParams = {}) {
  return useQuery({
    queryKey: ['listings', 'public', params],
    queryFn: () =>
      apiClient
        .get<PaginatedListings>('/listings/public/', { params })
        .then((r) => r.data),
    staleTime: 30_000,
    retry: 1,
  })
}

export function useFeaturedListings() {
  return useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () =>
      apiClient.get<Listing[]>('/listings/featured/').then((r) => r.data),
    staleTime: 30_000,
    retry: 1,
  })
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: () =>
      apiClient.get<Listing>(`/listings/${id}/`).then((r) => r.data),
    enabled: !!id,
  })
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () =>
      apiClient.get<PlatformStats>('/listings/stats/').then((r) => r.data),
    staleTime: 5 * 60_000,
    retry: false,
  })
}
