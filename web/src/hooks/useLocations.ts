'use client'

import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export function useRegions() {
  return useQuery({
    queryKey: ['locations', 'regions'],
    queryFn: () => apiClient.get<string[]>('/locations/regions/').then((r) => r.data),
    staleTime: Infinity,
    retry: 1,
  })
}

export function useZones(region: string) {
  return useQuery({
    queryKey: ['locations', 'zones', region],
    queryFn: () =>
      apiClient.get<string[]>('/locations/zones/', { params: { region } }).then((r) => r.data),
    enabled: !!region,
    staleTime: Infinity,
    retry: 1,
  })
}

export function useWoredas(zone: string) {
  return useQuery({
    queryKey: ['locations', 'woredas', zone],
    queryFn: () =>
      apiClient.get<string[]>('/locations/woredas/', { params: { zone } }).then((r) => r.data),
    enabled: !!zone,
    staleTime: Infinity,
    retry: 1,
  })
}
