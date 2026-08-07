'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import authApiClient from '@/lib/authApiClient'
import type { Submission } from '@/types/submission'

export function useMySubmissions() {
  return useQuery({
    queryKey: ['submissions', 'mine'],
    queryFn: () =>
      authApiClient.get<Submission[]>('/submissions/mine/').then((r) => r.data),
  })
}

export function useSubmissions(status?: string) {
  return useQuery({
    queryKey: ['submissions', 'queue', status],
    queryFn: () =>
      authApiClient
        .get<Submission[]>('/submissions/', { params: status ? { status } : {} })
        .then((r) => r.data),
  })
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      authApiClient.patch(`/submissions/${id}/`, { status }).then((r) => r.data),
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
