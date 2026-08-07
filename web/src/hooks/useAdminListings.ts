'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import authApiClient from '@/lib/authApiClient'
import type { Listing, PaginatedListings } from '@/types/listing'

export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

export interface PaginatedAdminUsers {
  count: number
  next: string | null
  previous: string | null
  results: AdminUser[]
}

export interface AdminListingsParams {
  page?: number
  q?: string
  category?: string
  listing_type?: string
  status?: string
  region?: string
  verified?: string
  featured?: string
}

export interface AdminUsersParams {
  page?: number
  q?: string
  role?: string
}

export function useAllListings(params: AdminListingsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'listings', params],
    queryFn: () =>
      authApiClient
        .get<PaginatedListings>('/listings/admin/', { params })
        .then((r) => r.data),
  })
}

export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () =>
      authApiClient
        .get<PaginatedAdminUsers>('/auth/users/', { params })
        .then((r) => r.data),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings', 'mine'] })
      qc.invalidateQueries({ queryKey: ['admin', 'listings'] })
    },
  })
}

export function useCreateBroker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      first_name: string
      last_name: string
      email: string
      phone: string
      password: string
    }) => {
      const res = await authApiClient.post<{ id: string }>('/auth/register/', data)
      const userId = res.data.id
      await authApiClient.patch(`/auth/users/${userId}/role/`, { role: 'BROKER' })
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
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

export function useUploadMedia() {
  return useMutation({
    mutationFn: ({ listingId, file }: { listingId: string; file: File }) => {
      const fd = new FormData()
      fd.append('file', file)
      return authApiClient
        .post(`/media/listings/${listingId}/media/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
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
