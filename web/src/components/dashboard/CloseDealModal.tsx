'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCloseDeal } from '@/hooks/useAdminListings'
import { toast } from 'react-hot-toast'
import type { Listing } from '@/types/listing'

interface Props {
  listing: Listing
  onClose: () => void
}

export function CloseDealModal({ listing, onClose }: Props) {
  const closeDeal = useCloseDeal()
  const [form, setForm] = useState({ actual_price: '', commission_rate: '3', notes: '' })
  const [confirmStep, setConfirmStep] = useState<null | { skipDeal: boolean }>(null)

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  const commission =
    form.actual_price && form.commission_rate
      ? ((parseFloat(form.actual_price) * parseFloat(form.commission_rate)) / 100).toLocaleString('en-ET')
      : null

  const closedAs = listing.listing_type === 'RENT' ? 'Rented' : 'Sold'

  async function executClose(skipDeal: boolean) {
    try {
      await closeDeal.mutateAsync({
        listingId: listing.id,
        data: skipDeal ? {} : {
          ...(form.actual_price ? { actual_price: form.actual_price } : {}),
          ...(form.commission_rate ? { commission_rate: form.commission_rate } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        },
      })
      toast.success(`Listing marked as ${closedAs}`)
      onClose()
    } catch {
      toast.error('Failed to close deal')
    } finally {
      setConfirmStep(null)
    }
  }

  // Confirmation step
  if (confirmStep !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold">Mark listing as {closedAs}?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This will permanently change the listing status to <strong>{closedAs.toUpperCase()}</strong> and
                remove it from public search results. This cannot be undone from the UI.
              </p>
            </div>
          </div>
          {confirmStep.skipDeal ? (
            <p className="text-xs bg-muted rounded-lg px-3 py-2 text-muted-foreground">
              No deal data will be recorded. Earnings summary will not be updated.
            </p>
          ) : commission ? (
            <p className="text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              Commission to record: <strong className="text-primary">ETB {commission}</strong>
            </p>
          ) : null}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmStep(null)} disabled={closeDeal.isPending}>
              Back
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => executClose(confirmStep.skipDeal)}
              disabled={closeDeal.isPending}
            >
              {closeDeal.isPending ? 'Closing…' : `Confirm — Mark ${closedAs}`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold">Close Deal</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{listing.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            All fields are optional — click <strong>Skip &amp; Close</strong> to mark the listing as closed without recording deal data.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="actual_price">Actual Sale Price (ETB)</Label>
            <Input
              id="actual_price"
              type="number"
              value={form.actual_price}
              onChange={(e) => update('actual_price', e.target.value)}
              placeholder="e.g. 2500000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commission_rate">Commission % <span className="text-muted-foreground font-normal">(default 3%)</span></Label>
            <Input
              id="commission_rate"
              type="number"
              step="0.5"
              value={form.commission_rate}
              onChange={(e) => update('commission_rate', e.target.value)}
              placeholder="3"
            />
          </div>

          {commission && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              <span className="text-muted-foreground">Commission earned: </span>
              <span className="font-bold text-primary">ETB {commission}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">optional</span></Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any notes about the deal..."
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmStep({ skipDeal: true })}>
            Skip &amp; Close
          </Button>
          <Button className="flex-1" onClick={() => setConfirmStep({ skipDeal: false })}>
            Save &amp; Close
          </Button>
        </div>
      </div>
    </div>
  )
}
