'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import authApiClient from '@/lib/authApiClient'
import type { Listing } from '@/types/listing'

interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

export function useAllListings() {
  return useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: () => authApiClient.get<Listing[]>('/listings/admin/').then((r) => r.data),
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => authApiClient.get<AdminUser[]>('/auth/users/').then((r) => r.data),
  })
}

export function useVerifyListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => authApiClient.patch(`/listings/${id}/verify/`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'listings'] })
      qc.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

export function useFeatureListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => authApiClient.patch(`/listings/${id}/feature/`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'listings'] })
      qc.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

export function useChangeUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      authApiClient.patch(`/auth/users/${id}/role/`, { role }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useCreateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authApiClient.post('/listings/create/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  })
}

export function useUpdateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      authApiClient.patch(`/listings/${id}/update/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings', 'mine'] })
      qc.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

export function useCloseDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listingId, data }: { listingId: string; data: Record<string, unknown> }) =>
      authApiClient.post(`/listings/${listingId}/close/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings', 'mine'] })
      qc.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}
