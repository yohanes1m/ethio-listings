'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Upload, X } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRegions, useZones, useWoredas } from '@/hooks/useLocations'
import { useSubmit } from '@/hooks/useSubmissions'
import authApiClient from '@/lib/authApiClient'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = ['Category', 'Details', 'Location', 'Photos', 'Contact']

export default function SubmitPage() {
  return (
    <ProtectedRoute>
      <SubmitForm />
    </ProtectedRoute>
  )
}

function SubmitForm() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    category: '',
    listing_type: '',
    details: {} as Record<string, string | number | boolean>,
    region: '',
    zone: '',
    woreda: '',
    address: '',
    owner_phone: '',
    owner_whatsapp: '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { data: regions } = useRegions()
  const { data: zones } = useZones(form.region)
  const { data: woredas } = useWoredas(form.zone)
  const submit = useSubmit()

  function update(field: string, value: string) {
    if (field === 'region') {
      setForm((prev) => ({ ...prev, region: value, zone: '', woreda: '' }))
    } else if (field === 'zone') {
      setForm((prev) => ({ ...prev, zone: value, woreda: '' }))
    } else {
      setForm((prev) => ({ ...prev, [field]: value }))
    }
  }

  function updateDetail(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }))
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const remaining = 5 - photos.length
    const newFiles = Array.from(fileList).slice(0, remaining)
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setPhotos((prev) => [...prev, ...newFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index] ?? '')
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  function next() {
    setStep((s) => (s < 5 ? ((s + 1) as Step) : s))
  }

  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
  }

  async function handleSubmit() {
    const photoUrls: string[] = []
    for (const file of photos) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await authApiClient.post<{ url: string }>('/media/upload/', fd)
        photoUrls.push(res.data.url)
      } catch {
        // skip failed upload, continue with remaining
      }
    }

    await submit.mutateAsync({
      category: form.category,
      listing_type: form.listing_type,
      region: form.region,
      zone: form.zone || undefined,
      woreda: form.woreda || undefined,
      address: form.address || undefined,
      owner_phone: form.owner_phone,
      ...(form.owner_whatsapp ? { owner_whatsapp: form.owner_whatsapp } : {}),
      details: form.details,
      ...(photoUrls.length > 0 ? { photos: photoUrls } : {}),
    })
    router.push('/my-submissions')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step
          const active = n === step
          const done = n < step
          return (
            <div key={label} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 ${i > 0 ? 'flex-1' : ''}`}>
                {i > 0 && (
                  <div className={`flex-1 h-px ${done ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : done
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? '✓' : n}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Step {step}: {STEPS[step - 1]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Category */}
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => { if (v) update('category', v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="For sale or rent?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALE">For Sale</SelectItem>
                    <SelectItem value="RENT">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step 2: Details — category-specific */}
          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label>Title / Property Name</Label>
                <Input
                  value={String(form.details.title ?? '')}
                  onChange={(e) => updateDetail('title', e.target.value)}
                  placeholder="e.g. 3-bedroom apartment in Bole"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price (ETB)</Label>
                <Input
                  type="number"
                  value={String(form.details.price ?? '')}
                  onChange={(e) => updateDetail('price', e.target.value)}
                  placeholder="e.g. 2500000"
                />
              </div>

              {form.category === 'HOUSE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bedrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      value={String(form.details.bedrooms ?? '')}
                      onChange={(e) => updateDetail('bedrooms', parseInt(e.target.value))}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Area (m²)</Label>
                    <Input
                      type="number"
                      value={String(form.details.area_sqm ?? '')}
                      onChange={(e) => updateDetail('area_sqm', e.target.value)}
                      placeholder="120"
                    />
                  </div>
                </div>
              )}

              {form.category === 'CAR' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Make</Label>
                      <Input
                        value={String(form.details.make ?? '')}
                        onChange={(e) => updateDetail('make', e.target.value)}
                        placeholder="Toyota"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Model</Label>
                      <Input
                        value={String(form.details.model ?? '')}
                        onChange={(e) => updateDetail('model', e.target.value)}
                        placeholder="Land Cruiser"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={String(form.details.year ?? '')}
                        onChange={(e) => updateDetail('year', parseInt(e.target.value))}
                        placeholder="2020"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mileage (km)</Label>
                      <Input
                        type="number"
                        value={String(form.details.mileage_km ?? '')}
                        onChange={(e) => updateDetail('mileage_km', parseInt(e.target.value))}
                        placeholder="50000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Condition</Label>
                      <Select
                        value={String(form.details.condition ?? '')}
                        onValueChange={(v) => { if (v) updateDetail('condition', v) }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">New</SelectItem>
                          <SelectItem value="EXCELLENT">Excellent</SelectItem>
                          <SelectItem value="GOOD">Good</SelectItem>
                          <SelectItem value="FAIR">Fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fuel Type</Label>
                      <Select
                        value={String(form.details.fuel_type ?? '')}
                        onValueChange={(v) => { if (v) updateDetail('fuel_type', v) }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PETROL">Petrol</SelectItem>
                          <SelectItem value="DIESEL">Diesel</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                          <SelectItem value="ELECTRIC">Electric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transmission</Label>
                    <Select
                      value={String(form.details.transmission ?? '')}
                      onValueChange={(v) => { if (v) updateDetail('transmission', v) }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {form.category === 'LAND' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Total Area</Label>
                      <Input
                        type="number"
                        value={String(form.details.total_area ?? '')}
                        onChange={(e) => updateDetail('total_area', e.target.value)}
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Area Unit</Label>
                      <Select
                        value={String(form.details.area_unit ?? 'SQM')}
                        onValueChange={(v) => { if (v) updateDetail('area_unit', v) }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SQM">m²</SelectItem>
                          <SelectItem value="HECTARE">Hectare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Land Use</Label>
                    <Select
                      value={String(form.details.land_use ?? '')}
                      onValueChange={(v) => { if (v) updateDetail('land_use', v) }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select use" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                        <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                        <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
                        <SelectItem value="MIXED">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(form.details.has_title_deed)}
                        onChange={(e) => updateDetail('has_title_deed', e.target.checked)}
                        className="rounded"
                      />
                      Has Title Deed
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(form.details.road_access)}
                        onChange={(e) => updateDetail('road_access', e.target.checked)}
                        className="rounded"
                      />
                      Road Access
                    </label>
                  </div>
                </>
              )}

              {form.category === 'MACHINE' && (
                <>
                  <div className="space-y-1.5">
                    <Label>Machine Type</Label>
                    <Input
                      value={String(form.details.machine_type ?? '')}
                      onChange={(e) => updateDetail('machine_type', e.target.value)}
                      placeholder="Tractor, Excavator, Generator…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Manufacturer</Label>
                      <Input
                        value={String(form.details.manufacturer ?? '')}
                        onChange={(e) => updateDetail('manufacturer', e.target.value)}
                        placeholder="John Deere"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={String(form.details.year ?? '')}
                        onChange={(e) => updateDetail('year', parseInt(e.target.value))}
                        placeholder="2018"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Condition</Label>
                      <Select
                        value={String(form.details.condition ?? '')}
                        onValueChange={(v) => { if (v) updateDetail('condition', v) }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">New</SelectItem>
                          <SelectItem value="USED">Used</SelectItem>
                          <SelectItem value="RECONDITIONED">Reconditioned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Operating Hours</Label>
                      <Input
                        type="number"
                        value={String(form.details.operating_hours ?? '')}
                        onChange={(e) => updateDetail('operating_hours', parseInt(e.target.value))}
                        placeholder="2000"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => { if (v) update('region', v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {(regions ?? []).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.region && (
                <div className="space-y-1.5">
                  <Label>Zone</Label>
                  <Select value={form.zone} onValueChange={(v) => { if (v) update('zone', v) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {(zones ?? []).map((z) => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.zone && (
                <div className="space-y-1.5">
                  <Label>Woreda</Label>
                  <Select value={form.woreda} onValueChange={(v) => { if (v) update('woreda', v) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select woreda" />
                    </SelectTrigger>
                    <SelectContent>
                      {(woredas ?? []).map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>
                  Address <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Street, building, landmark..."
                />
              </div>
            </>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload up to 5 photos. The first photo becomes the cover image.
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Drop photos here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — max 5 files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                          Cover
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                    >
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}

              {photos.length === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  No photos yet — you can skip this step.
                </p>
              )}
            </div>
          )}

          {/* Step 5: Contact */}
          {step === 5 && (
            <>
              <div className="space-y-1.5">
                <Label>Your Phone Number</Label>
                <Input
                  type="tel"
                  value={form.owner_phone}
                  onChange={(e) => update('owner_phone', e.target.value)}
                  placeholder="+251 9xx xxx xxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  WhatsApp <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  type="tel"
                  value={form.owner_whatsapp}
                  onChange={(e) => update('owner_whatsapp', e.target.value)}
                  placeholder="+251 9xx xxx xxx"
                />
              </div>
              <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Review</p>
                <p>Category: {form.category}</p>
                <p>Type: {form.listing_type}</p>
                <p>
                  Location: {form.region}
                  {form.zone ? `, ${form.zone}` : ''}
                  {form.woreda ? `, ${form.woreda}` : ''}
                </p>
                {photos.length > 0 && <p>Photos: {photos.length}</p>}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={step === 1}>
              Back
            </Button>
            {step < 5 ? (
              <Button
                onClick={next}
                disabled={
                  (step === 1 && (!form.category || !form.listing_type)) ||
                  (step === 3 && !form.region)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submit.isPending || !form.owner_phone}
              >
                {submit.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
