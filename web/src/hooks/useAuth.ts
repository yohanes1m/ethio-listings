'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import apiClient from '@/lib/apiClient'
import authApiClient from '@/lib/authApiClient'
import { useAuthStore } from '@/store/authStore'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

interface TokenResponse {
  access: string
  refresh: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'BUYER' | 'BROKER' | 'ADMIN'
  phone: string | null
  avatar: string | null
}

export function useLogin() {
  const { setTokens, setUser } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiClient.post<TokenResponse>('/auth/login/', payload).then((r) => r.data),
    onSuccess: async (data) => {
      setTokens(data.access, data.refresh)
      const me = await authApiClient.get<User>('/auth/me/').then((r) => r.data)
      setUser(me)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      router.push('/dashboard')
    },
    onError: () => {
      toast.error('Invalid email or password')
    },
  })
}

export function useRegister() {
  const { setTokens, setUser } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      apiClient.post<TokenResponse>('/auth/register/', payload).then((r) => r.data),
    onSuccess: async (data) => {
      setTokens(data.access, data.refresh)
      const me = await authApiClient.get<User>('/auth/me/').then((r) => r.data)
      setUser(me)
      router.push('/dashboard')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { email?: string[] } } })?.response?.data?.email?.[0] ??
        'Registration failed'
      toast.error(msg)
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post('/auth/forgot-password/', { email }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Password reset link sent — check your email')
    },
    onError: () => {
      toast.error('Failed to send reset email')
    },
  })
}

export function useResetPassword() {
  const router = useRouter()

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      apiClient.post('/auth/reset-password/', { token, password }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Password updated — please sign in')
      router.push('/auth/login')
    },
    onError: () => {
      toast.error('Invalid or expired reset link')
    },
  })
}

export function useMe() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApiClient.get<User>('/auth/me/').then((r) => r.data),
    enabled: isAuthenticated,
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  return () => {
    logout()
    queryClient.clear()
    router.push('/auth/login')
  }
}
