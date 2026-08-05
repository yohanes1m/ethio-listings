'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const logout = useLogout()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">
                Hello, {user?.first_name ?? 'there'} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Role: {user?.role}
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>

          <RoleGuard roles={['BROKER', 'ADMIN']}>
            <div className="rounded-xl border border-border p-6 mb-4">
              <h2 className="font-semibold mb-2">Broker Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Listings management, deal close, and earnings summary — coming in Phase 12.
              </p>
            </div>
          </RoleGuard>

          <RoleGuard roles={['ADMIN']}>
            <div className="rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-2">Admin Panel</h2>
              <p className="text-sm text-muted-foreground">
                User management, verification queue — coming in Phase 12.
              </p>
            </div>
          </RoleGuard>

          <RoleGuard roles={['BUYER']}>
            <div className="rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-2">My Submissions</h2>
              <p className="text-sm text-muted-foreground">
                Track your listing requests — coming in Phase 10.
              </p>
            </div>
          </RoleGuard>
        </div>
      </div>
    </ProtectedRoute>
  )
}
