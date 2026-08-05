'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { useRegions } from '@/hooks/useLocations'
import { useCreateListing } from '@/hooks/useAdminListings'
import { toast } from 'react-hot-toast'

type Step = 1 | 2 | 3 | 4
const STEPS = ['Category', 'Details', 'Location', 'Review']

export default function AddListingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    category: '',
    listing_type: '',
    title: '',
    title_am: '',
    description: '',
    description_am: '',
    price: '',
    price_unit: '',
    price_negotiable: false,
    region: '',
    zone: '',
    woreda: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    area_sqm: '',
    furnished: false,
    parking: false,
    make: '',
    model: '',
    year: '',
    mileage_km: '',
    transmission: '',
    fuel_type: '',
    condition: '',
    house_type: '',
    land_use: '',
    total_area: '',
    has_title_deed: false,
    machine_type: '',
    manufacturer: '',
    operating_hours: '',
  })

  const { data: regions } = useRegions()
  const create = useCreateListing()

  function update(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function next() { setStep((s) => (s < 4 ? (s + 1) as Step : s)) }
  function back() { setStep((s) => (s > 1 ? (s - 1) as Step : s)) }

  async function handleSubmit() {
    try {
      await create.mutateAsync(form)
      toast.success('Listing created!')
      router.push('/dashboard/my-listings')
    } catch {
      toast.error('Failed to create listing')
    }
  }

  const stepValid = () => {
    if (step === 1) return !!(form.category && form.listing_type)
    if (step === 2) return !!(form.title && form.price)
    if (step === 3) return !!form.region
    return true
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold">Add New Listing</h1>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step
          const done = n < step
          const active = n === step
          return (
            <div key={label} className="flex items-center flex-1">
              {i > 0 && <div className={`flex-1 h-px ${done ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                active ? 'bg-primary text-primary-foreground' : done ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {done ? '✓' : n}
              </div>
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step {step}: {STEPS[step - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Category */}
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => { if (v) update('category', v) }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOUSE">🏠 House</SelectItem>
                    <SelectItem value="LAND">🌿 Land</SelectItem>
                    <SelectItem value="CAR">🚗 Car</SelectItem>
                    <SelectItem value="MACHINE">⚙️ Machine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Listing Type</Label>
                <Select value={form.listing_type} onValueChange={(v) => { if (v) update('listing_type', v) }}>
                  <SelectTrigger><SelectValue placeholder="Sale or Rent?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALE">For Sale</SelectItem>
                    <SelectItem value="RENT">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label>Title (English)</Label>
                <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. 3BR Apartment in Bole" />
              </div>
              <div className="space-y-1.5">
                <Label>Title (Amharic) <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
                <Input value={form.title_am} onChange={(e) => update('title_am', e.target.value)} placeholder="የአማርኛ ርዕስ" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} placeholder="Describe the listing..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Price (ETB)</Label>
                  <Input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="2500000" />
                </div>
                {form.listing_type === 'RENT' && (
                  <div className="space-y-1.5">
                    <Label>Price Unit</Label>
                    <Select value={form.price_unit} onValueChange={(v) => { if (v) update('price_unit', v) }}>
                      <SelectTrigger><SelectValue placeholder="Per?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_month">Per Month</SelectItem>
                        <SelectItem value="per_year">Per Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Category-specific fields */}
              {form.category === 'HOUSE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bedrooms</Label>
                    <Input type="number" min={0} value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} placeholder="3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bathrooms</Label>
                    <Input type="number" min={0} value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} placeholder="2" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Area (m²)</Label>
                    <Input type="number" value={form.area_sqm} onChange={(e) => update('area_sqm', e.target.value)} placeholder="120" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>House Type</Label>
                    <Select value={form.house_type} onValueChange={(v) => { if (v) update('house_type', v) }}>
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APARTMENT">Apartment</SelectItem>
                        <SelectItem value="VILLA">Villa</SelectItem>
                        <SelectItem value="TOWNHOUSE">Townhouse</SelectItem>
                        <SelectItem value="STUDIO">Studio</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {form.category === 'CAR' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Make</Label>
                    <Input value={form.make} onChange={(e) => update('make', e.target.value)} placeholder="Toyota" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Model</Label>
                    <Input value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="Land Cruiser" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} placeholder="2020" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mileage (km)</Label>
                    <Input type="number" value={form.mileage_km} onChange={(e) => update('mileage_km', e.target.value)} placeholder="50000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transmission</Label>
                    <Select value={form.transmission} onValueChange={(v) => { if (v) update('transmission', v) }}>
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Condition</Label>
                    <Select value={form.condition} onValueChange={(v) => { if (v) update('condition', v) }}>
                      <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="EXCELLENT">Excellent</SelectItem>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {form.category === 'LAND' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Total Area</Label>
                    <Input type="number" value={form.total_area} onChange={(e) => update('total_area', e.target.value)} placeholder="500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Land Use</Label>
                    <Select value={form.land_use} onValueChange={(v) => { if (v) update('land_use', v) }}>
                      <SelectTrigger><SelectValue placeholder="Use" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                        <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                        <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
                        <SelectItem value="MIXED">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {form.category === 'MACHINE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Machine Type</Label>
                    <Input value={form.machine_type} onChange={(e) => update('machine_type', e.target.value)} placeholder="Excavator, Generator..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Manufacturer</Label>
                    <Input value={form.manufacturer} onChange={(e) => update('manufacturer', e.target.value)} placeholder="Komatsu" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Condition</Label>
                    <Select value={form.condition} onValueChange={(v) => { if (v) update('condition', v) }}>
                      <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="USED">Used</SelectItem>
                        <SelectItem value="RECONDITIONED">Reconditioned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Operating Hours</Label>
                    <Input type="number" value={form.operating_hours} onChange={(e) => update('operating_hours', e.target.value)} placeholder="2000" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => { if (v) update('region', v) }}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {(regions ?? []).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zone <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
                <Input value={form.zone} onChange={(e) => update('zone', e.target.value)} placeholder="e.g. Bole" />
              </div>
              <div className="space-y-1.5">
                <Label>Woreda <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
                <Input value={form.woreda} onChange={(e) => update('woreda', e.target.value)} placeholder="e.g. Kirkos" />
              </div>
              <div className="space-y-1.5">
                <Label>Address <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
                <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Street, building, landmark..." />
              </div>
            </>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted p-4 space-y-2">
                <p><span className="text-muted-foreground">Category:</span> {form.category}</p>
                <p><span className="text-muted-foreground">Type:</span> {form.listing_type}</p>
                <p><span className="text-muted-foreground">Title:</span> {form.title}</p>
                <p><span className="text-muted-foreground">Price:</span> ETB {Number(form.price).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Location:</span> {form.region}{form.zone ? `, ${form.zone}` : ''}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
            {step < 4 ? (
              <Button onClick={next} disabled={!stepValid()}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={create.isPending}>
                {create.isPending ? 'Creating...' : 'Publish Listing'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
