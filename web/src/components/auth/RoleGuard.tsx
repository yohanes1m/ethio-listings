'use client'

import { useAuthStore } from '@/store/authStore'

type Role = 'BUYER' | 'BROKER' | 'ADMIN'

interface Props {
  roles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: Props) {
  const { user } = useAuthStore()

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
