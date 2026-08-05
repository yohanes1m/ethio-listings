'use client'

import Link from 'next/link'
import { PlusCircle, InboxIcon, ListChecks } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useMyListings } from '@/hooks/useListings'
import { formatPrice } from '@/lib/listingUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: listings, isLoading } = useMyListings()

  const active = listings?.filter((l) => l.status === 'ACTIVE').length ?? 0
  const totalViews = listings?.reduce((sum, l) => sum + l.view_count, 0) ?? 0

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.first_name} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.role} · {user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Listings', value: isLoading ? '—' : active },
          { label: 'Total Listings', value: isLoading ? '—' : (listings?.length ?? 0) },
          { label: 'Total Views', value: isLoading ? '—' : totalViews },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border p-4">
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
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

      {/* Recent listings */}
      <div>
        <h2 className="font-semibold mb-3">Recent Listings</h2>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        )}
        {!isLoading && listings?.slice(0, 5).map((l) => (
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
        {!isLoading && !listings?.length && (
          <p className="text-sm text-muted-foreground">
            No listings yet.{' '}
            <Link href="/dashboard/add" className="text-primary underline">Add one →</Link>
          </p>
        )}
      </div>
    </div>
  )
}
