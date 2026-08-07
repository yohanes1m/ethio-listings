'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Eye, Star, X } from 'lucide-react'
import { useAllListings, useVerifyListing, useFeatureListing } from '@/hooks/useAdminListings'
import { formatPrice } from '@/lib/listingUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 20

type PendingAction = {
  title: string
  description: string
  confirmLabel: string
  variant: 'default' | 'warning'
  action: () => void
}

export default function AllListingsPage() {
  return (
    <RoleGuard roles={['ADMIN']}>
      <AllListingsContent />
    </RoleGuard>
  )
}

function AllListingsContent() {
  const verify = useVerifyListing()
  const feature = useFeatureListing()
  const [pending, setPending] = useState<PendingAction | null>(null)

  const [params, setParams] = useState({
    page: 1, q: '', category: '', listing_type: '', status: '', region: '', verified: '', featured: '',
  })

  const { data, isLoading } = useAllListings(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== 0))
  )

  function setParam(key: string, value: string | null | number) {
    setParams((p) => ({ ...p, [key]: value ?? '', page: 1 }))
  }

  const hasFilters = Object.entries(params).some(([k, v]) => k !== 'page' && v !== '')

  function clearFilters() {
    setParams({ page: 1, q: '', category: '', listing_type: '', status: '', region: '', verified: '', featured: '' })
  }

  function confirmVerify(l: { id: string; title: string; is_verified: boolean }) {
    setPending({
      title: l.is_verified ? 'Remove verification?' : 'Verify this listing?',
      description: l.is_verified
        ? `"${l.title}" will lose its verified badge and buyers will no longer see it as verified.`
        : `"${l.title}" will receive a verified badge visible to all buyers.`,
      confirmLabel: l.is_verified ? 'Remove verification' : 'Verify listing',
      variant: l.is_verified ? 'warning' : 'default',
      action: () => verify.mutate(l.id),
    })
  }

  function confirmFeature(l: { id: string; title: string; is_featured: boolean }) {
    setPending({
      title: l.is_featured ? 'Remove from featured?' : 'Feature this listing?',
      description: l.is_featured
        ? `"${l.title}" will be removed from the featured section on the homepage.`
        : `"${l.title}" will appear in the featured section on the homepage.`,
      confirmLabel: l.is_featured ? 'Remove featured' : 'Feature listing',
      variant: 'default',
      action: () => feature.mutate(l.id),
    })
  }

  const isMutating = verify.isPending || feature.isPending
  const listings = data?.results ?? []
  const total = data?.count ?? 0

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">All Listings</h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search listings…"
          value={params.q}
          onChange={(e) => setParam('q', e.target.value)}
          className="h-8 text-xs w-48 min-w-[160px]"
        />
        <Select value={params.category} onValueChange={(v) => setParam('category', v)}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOUSE">House</SelectItem>
            <SelectItem value="LAND">Land</SelectItem>
            <SelectItem value="CAR">Car</SelectItem>
            <SelectItem value="MACHINE">Machine</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.listing_type} onValueChange={(v) => setParam('listing_type', v)}>
          <SelectTrigger className="h-8 text-xs w-28">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SALE">For Sale</SelectItem>
            <SelectItem value="RENT">For Rent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.status} onValueChange={(v) => setParam('status', v)}>
          <SelectTrigger className="h-8 text-xs w-28">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
            <SelectItem value="RENTED">Rented</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.verified} onValueChange={(v) => setParam('verified', v)}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="Verified" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Verified only</SelectItem>
            <SelectItem value="false">Unverified only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.featured} onValueChange={(v) => setParam('featured', v)}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="Featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Featured only</SelectItem>
            <SelectItem value="false">Not featured</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={clearFilters}>
            <X className="w-3.5 h-3.5 mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? hasFilters ? 'No listings match your filters.' : 'No listings yet.'
            : `Showing ${Math.min((params.page - 1) * PAGE_SIZE + 1, total)}–${Math.min(params.page * PAGE_SIZE, total)} of ${total}`}
        </p>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {hasFilters ? 'No listings match your filters.' : 'No listings yet.'}
        </div>
      )}

      {listings.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {listings.map((l) => (
            <div key={l.id} className="p-4 bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium truncate">{l.title}</p>
                    {l.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    {l.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l.category} · {l.listing_type} · {l.location?.region ?? '—'}
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-primary mt-1">
                    {formatPrice(l.price, l.price_unit)}
                  </p>
                </div>
                <Badge variant={l.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                  {l.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-1 mt-3">
                <Link href={`/listings/${l.id}`} target="_blank">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Eye className="w-3.5 h-3.5" />View
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="sm"
                  className={`h-7 text-xs ${l.is_verified ? 'text-emerald-700' : ''}`}
                  onClick={() => confirmVerify(l)}
                >
                  {l.is_verified ? '✓ Verified' : 'Verify'}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className={`h-7 text-xs ${l.is_featured ? 'text-amber-600' : ''}`}
                  onClick={() => confirmFeature(l)}
                >
                  {l.is_featured ? '★ Featured' : 'Feature'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={params.page}
        count={total}
        pageSize={PAGE_SIZE}
        onChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
      />

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => { if (!open) setPending(null) }}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmLabel={pending?.confirmLabel ?? 'Confirm'}
        variant={pending?.variant ?? 'default'}
        isLoading={isMutating}
        onConfirm={() => { pending?.action(); setPending(null) }}
      />
    </div>
  )
}
