'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import authApiClient from '@/lib/authApiClient'
import type { Submission, PaginatedSubmissions } from '@/types/submission'

export interface SubmissionsParams {
  page?: number
  status?: string
  q?: string
  category?: string
  listing_type?: string
  region?: string
}

export function useMySubmissions() {
  return useQuery({
    queryKey: ['submissions', 'mine'],
    queryFn: () =>
      authApiClient.get<Submission[]>('/submissions/mine/').then((r) => r.data),
  })
}

export function useSubmissions(params: SubmissionsParams = {}) {
  return useQuery({
    queryKey: ['submissions', 'queue', params],
    queryFn: () =>
      authApiClient
        .get<PaginatedSubmissions>('/submissions/', { params })
        .then((r) => r.data),
  })
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, owner_message }: { id: string; status: string; owner_message?: string }) =>
      authApiClient.patch(`/submissions/${id}/`, { status, ...(owner_message ? { owner_message } : {}) }).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['submissions'] })
      toast.success('Submission updated')
    },
  })
}

export function useApproveSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      authApiClient.post(`/submissions/${id}/approve/`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['submissions'] })
      toast.success('Submission approved — listing is now live')
    },
    onError: () => {
      toast.error('Approval failed — please try again')
    },
  })
}

export function useSubmit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authApiClient.post<Submission>('/submissions/', data).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['submissions'] })
      toast.success('Listing request submitted!')
    },
    onError: () => {
      toast.error('Submission failed — please try again')
    },
  })
}
