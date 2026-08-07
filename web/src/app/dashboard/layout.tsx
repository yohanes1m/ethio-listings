'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  InboxIcon,
  Users,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: string[]
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/my-listings', label: 'My Listings', icon: <ListChecks className="w-4 h-4" />, roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/add', label: 'Add Listing', icon: <PlusCircle className="w-4 h-4" />, roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/submissions', label: 'Submissions', icon: <InboxIcon className="w-4 h-4" />, roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/all-listings', label: 'All Listings', icon: <ListChecks className="w-4 h-4" />, roles: ['ADMIN'] },
  { href: '/dashboard/users', label: 'Users', icon: <Users className="w-4 h-4" />, roles: ['ADMIN'] },
  { href: '/dashboard/verifications', label: 'Verifications', icon: <ShieldCheck className="w-4 h-4" />, roles: ['ADMIN'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const logout = useLogout()
  const pathname = usePathname()
  const router = useRouter()
  const role = user?.role ?? ''

  useEffect(() => {
    if (user && role === 'BUYER') {
      router.replace('/saved')
    }
  }, [user, role, router])

  const visibleNav = NAV.filter((item) => item.roles.includes(role))

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border shrink-0">
        <div className="p-5 border-b border-border">
          <Link href="/" className="text-sm font-bold">
            <span className="text-primary">Ethio</span>Listings
          </Link>
          <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {role}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {visibleNav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border">
          <Link href="/" className="text-sm font-bold">
            <span className="text-primary">Ethio</span>Listings
          </Link>
          <button onClick={logout} className="text-sm text-muted-foreground">Sign Out</button>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-border">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === item.href
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground bg-muted'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
