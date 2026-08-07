'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Inbox,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Home,
  Handshake,
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
  roles: string[]
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { href: '/dashboard',              label: 'Overview',       Icon: LayoutDashboard, roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/my-listings',  label: 'My Listings',    Icon: ListChecks,      roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/add',          label: 'Add Listing',    Icon: PlusCircle,      roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/submissions',  label: 'Submissions',    Icon: Inbox,           roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/deals',        label: 'Deals',          Icon: Handshake,       roles: ['BROKER', 'ADMIN'] },
  { href: '/dashboard/all-listings', label: 'All Listings',   Icon: ListChecks,      roles: ['ADMIN'], adminOnly: true },
  { href: '/dashboard/users',        label: 'Users',          Icon: Users,           roles: ['ADMIN'] },
  { href: '/dashboard/verifications',label: 'Verifications',  Icon: ShieldCheck,     roles: ['ADMIN'] },
]

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?'
}

function SidebarContent({ onClose = () => {} }: { onClose?: () => void }) {
  const { user } = useAuthStore()
  const logout = useLogout()
  const pathname = usePathname()
  const role = user?.role ?? ''

  const visible = NAV.filter((item) => item.roles.includes(role))
  const firstAdminIdx = visible.findIndex((i) => i.adminOnly)

  return (
    <div className="flex flex-col h-full select-none">
      {/* Logo row */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="text-sm font-bold tracking-tight"
        >
          <span className="text-primary">Ethio</span>Listings
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold text-[13px] flex items-center justify-center shrink-0"
            aria-hidden
          >
            {initials(user?.first_name ?? '', user?.last_name ?? '')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
        <span className="mt-2.5 inline-flex text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visible.map((item, idx) => {
          const active = pathname === item.href
          const showSection = idx === firstAdminIdx && firstAdminIdx > 0

          return (
            <div key={item.href}>
              {showSection && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-3 pt-5 pb-2">
                  Administration
                </p>
              )}
              <Link
                href={item.href}
                onClick={onClose}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                {active && (
                  <span className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full bg-primary" />
                )}
                <item.Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-0.5 shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
        >
          <Home className="w-4 h-4 shrink-0" />
          Back to site
        </Link>
        <button
          onClick={() => { logout(); onClose?.() }}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const role = user?.role ?? ''
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (user && role === 'BUYER') router.replace('/saved')
  }, [user, role, router])

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — sticky full-height */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border shrink-0 sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer — slides in from left */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border md:hidden transition-transform duration-200 ease-in-out ${
          drawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setDrawerOpen(false)} />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-border bg-background/95 backdrop-blur shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="text-sm font-bold">
            <span className="text-primary">Ethio</span>Listings
          </Link>
        </header>

        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
