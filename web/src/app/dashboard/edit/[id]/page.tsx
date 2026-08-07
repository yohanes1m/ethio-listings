'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useListing } from '@/hooks/useListings'
import { useUpdateListing } from '@/hooks/useAdminListings'
import { toast } from 'react-hot-toast'

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: listing, isLoading } = useListing(id)
  const update = useUpdateListing()

  function listingToForm(l: typeof listing) {
    return {
      title: l?.title ?? '',
      title_am: l?.title_am ?? '',
      description: l?.description ?? '',
      description_am: l?.description_am ?? '',
      price: l?.price ?? '',
      price_unit: l?.price_unit ?? '',
      price_negotiable: l?.price_negotiable ?? false,
      status: l?.status ?? '',
      region: l?.location?.region ?? '',
      zone: l?.location?.zone ?? '',
      woreda: l?.location?.woreda ?? '',
      address: l?.location?.address ?? '',
    }
  }

  const [seenListing, setSeenListing] = useState(listing)
  const [form, setForm] = useState(() => listingToForm(listing))
  if (seenListing !== listing) {
    setSeenListing(listing)
    setForm(listingToForm(listing))
  }

  function set(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSave() {
    try {
      await update.mutateAsync({ id, data: form })
      toast.success('Listing updated')
      router.push('/dashboard/my-listings')
    } catch {
      toast.error('Update failed')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!listing) {
    return <p className="text-muted-foreground">Listing not found.</p>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Listing</h1>
        <p className="text-xs text-muted-foreground">{listing.category} · {listing.listing_type}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title (English)</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Title (Amharic) <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
            <Input value={form.title_am} onChange={(e) => set('title_am', e.target.value)} placeholder="የአማርኛ ርዕስ" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (Amharic) <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
            <Textarea value={form.description_am} onChange={(e) => set('description_am', e.target.value)} rows={2} placeholder="የአማርኛ መግለጫ" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Price (ETB)</Label>
              <Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            {listing.listing_type === 'RENT' && (
              <div className="space-y-1.5">
                <Label>Price Unit</Label>
                <Select value={form.price_unit} onValueChange={(v) => { if (v) set('price_unit', v) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_month">Per Month</SelectItem>
                    <SelectItem value="per_year">Per Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => { if (v) set('status', v) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive (Hidden)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Region</Label>
            <Input value={form.region} onChange={(e) => set('region', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Zone <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
              <Input value={form.zone} onChange={(e) => set('zone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Woreda <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
              <Input value={form.woreda} onChange={(e) => set('woreda', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/my-listings')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
