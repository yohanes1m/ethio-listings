'use client'

import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import authApiClient from '@/lib/authApiClient'
import type { Listing, MapPin, PaginatedListings, PlatformStats } from '@/types/listing'

interface PublicListingsParams {
  category?: string
  listing_type?: string
  region?: string
  q?: string
  verified?: boolean
  price_min?: number
  price_max?: number
  page?: number
  // House
  bedrooms_min?: string
  furnished?: string
  parking?: string
  // Car
  make?: string
  fuel_type?: string
  transmission?: string
  condition?: string
  year_min?: string
  year_max?: string
  // Land
  land_use?: string
  has_title_deed?: string
  road_access?: string
  // Machine
  machine_type?: string
}

export interface MyListingsParams {
  page?: number
  q?: string
  category?: string
  listing_type?: string
  status?: string
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

export function useMapPins(params: PublicListingsParams = {}) {
  return useQuery({
    queryKey: ['listings', 'map', params],
    queryFn: () =>
      apiClient
        .get<MapPin[]>('/listings/map/', { params })
        .then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useMyListings(params: MyListingsParams = {}) {
  return useQuery({
    queryKey: ['listings', 'mine', params],
    queryFn: () =>
      authApiClient
        .get<PaginatedListings>('/listings/mine/', { params })
        .then((r) => r.data),
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
