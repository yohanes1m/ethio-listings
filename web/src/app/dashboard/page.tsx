'use client'

import Link from 'next/link'
import { PlusCircle, InboxIcon, ListChecks, Users, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useMyListings } from '@/hooks/useListings'
import { useAllListings, useAdminUsers } from '@/hooks/useAdminListings'
import { useSubmissions } from '@/hooks/useSubmissions'
import { formatPrice } from '@/lib/listingUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  return isAdmin ? <AdminOverview /> : <BrokerOverview />
}

function StatCard({ label, value, isLoading }: { label: string; value: number | string; isLoading?: boolean }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-2xl font-bold tabular-nums">{isLoading ? '—' : value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function AdminOverview() {
  const { user } = useAuthStore()
  const { data: allData, isLoading: loadingListings } = useAllListings({ status: 'ACTIVE' })
  const { data: unverifiedData } = useAllListings({ status: 'ACTIVE', verified: 'false' })
  const { data: recentData } = useAllListings({})
  const { data: usersData, isLoading: loadingUsers } = useAdminUsers({})
  const { data: pendingData, isLoading: loadingPending } = useSubmissions({ status: 'PENDING' })

  const active = allData?.count ?? 0
  const unverified = unverifiedData?.count ?? 0
  const pendingCount = pendingData?.count ?? 0

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.first_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin · {user?.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Listings" value={active} isLoading={loadingListings} />
        <StatCard label="Total Users" value={usersData?.count ?? 0} isLoading={loadingUsers} />
        <StatCard label="Pending Submissions" value={pendingCount} isLoading={loadingPending} />
        <StatCard label="Needs Verification" value={unverified} isLoading={loadingListings} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/submissions">
          <Button size="sm">
            <InboxIcon className="w-4 h-4 mr-2" />
            Submissions {pendingCount ? `(${pendingCount})` : ''}
          </Button>
        </Link>
        <Link href="/dashboard/all-listings">
          <Button variant="outline" size="sm">
            <ListChecks className="w-4 h-4 mr-2" />
            All Listings
          </Button>
        </Link>
        <Link href="/dashboard/users">
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
        </Link>
        <Link href="/dashboard/verifications">
          <Button variant="outline" size="sm">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Verifications {unverified ? `(${unverified})` : ''}
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Recent Listings</h2>
        {loadingListings && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        )}
        {recentData?.results.slice(0, 5).map((l) => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="flex items-center justify-between py-3 border-b border-border hover:bg-muted/50 px-2 rounded-lg transition-colors"
          >
            <div>
              <p className="text-sm font-medium line-clamp-1">{l.title}</p>
              <p className="text-xs text-muted-foreground">{l.category} · {l.view_count} views</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold tabular-nums">{formatPrice(l.price, l.price_unit)}</span>
              <Badge variant={l.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                {l.status}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function BrokerOverview() {
  const { user } = useAuthStore()
  const { data: activeData, isLoading } = useMyListings({ status: 'ACTIVE' })
  const { data: allData } = useMyListings({})

  const active = activeData?.count ?? 0
  const total = allData?.count ?? 0
  const totalViews = allData?.results.reduce((sum, l) => sum + l.view_count, 0) ?? 0

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.first_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Broker · {user?.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Active Listings" value={active} isLoading={isLoading} />
        <StatCard label="Total Listings" value={total} isLoading={isLoading} />
        <StatCard label="Total Views (first page)" value={totalViews} isLoading={isLoading} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/add">
          <Button size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Listing
          </Button>
        </Link>
        <Link href="/dashboard/submissions">
          <Button variant="outline" size="sm">
            <InboxIcon className="w-4 h-4 mr-2" />
            Submissions
          </Button>
        </Link>
        <Link href="/dashboard/my-listings">
          <Button variant="outline" size="sm">
            <ListChecks className="w-4 h-4 mr-2" />
            My Listings
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Recent Listings</h2>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        )}
        {!isLoading && allData?.results.slice(0, 5).map((l) => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="flex items-center justify-between py-3 border-b border-border hover:bg-muted/50 px-2 rounded-lg transition-colors"
          >
            <div>
              <p className="text-sm font-medium line-clamp-1">{l.title}</p>
              <p className="text-xs text-muted-foreground">{l.category} · {l.view_count} views</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold tabular-nums">{formatPrice(l.price, l.price_unit)}</span>
              <Badge variant={l.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                {l.status}
              </Badge>
            </div>
          </Link>
        ))}
        {!isLoading && !allData?.count && (
          <p className="text-sm text-muted-foreground">
            No listings yet.{' '}
            <Link href="/dashboard/add" className="text-primary underline">Add one →</Link>
          </p>
        )}
      </div>
    </div>
  )
}
