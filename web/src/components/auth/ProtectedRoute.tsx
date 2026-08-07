'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [_hasHydrated, isAuthenticated, router])

  // Hold render until persisted store is rehydrated from localStorage
  if (!_hasHydrated) return null

  if (!isAuthenticated) return null

  return <>{children}</>
}
