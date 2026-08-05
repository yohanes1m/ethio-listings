'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Upload, ImagePlus } from 'lucide-react'
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
import { useCreateListing, useUploadMedia } from '@/hooks/useAdminListings'
import { toast } from 'react-hot-toast'

type Step = 1 | 2 | 3 | 4 | 5
const STEPS = ['Category', 'Details', 'Location', 'Photos', 'Review']

interface MediaFile {
  file: File
  preview: string
}

export default function AddListingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(1)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])

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
  const uploadMedia = useUploadMedia()

  function update(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function next() { setStep((s) => (s < 5 ? (s + 1) as Step : s)) }
  function back() { setStep((s) => (s > 1 ? (s - 1) as Step : s)) }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newFiles: MediaFile[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue
      if (mediaFiles.length + newFiles.length >= 10) break
      newFiles.push({ file, preview: URL.createObjectURL(file) })
    }
    setMediaFiles((prev) => [...prev, ...newFiles])
  }

  function removeFile(index: number) {
    setMediaFiles((prev) => {
      URL.revokeObjectURL(prev[index]?.preview ?? '')
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  async function handleSubmit() {
    let listingId: string | undefined
    try {
      const result = await create.mutateAsync(form as unknown as Record<string, unknown>)
      listingId = (result as { id: string }).id
      toast.success('Listing created!')
    } catch {
      toast.error('Failed to create listing')
      return
    }

    if (listingId && mediaFiles.length > 0) {
      let uploaded = 0
      for (const mf of mediaFiles) {
        try {
          await uploadMedia.mutateAsync({ listingId, file: mf.file })
          uploaded++
        } catch {
          // continue with remaining files
        }
      }
      if (uploaded < mediaFiles.length) {
        toast.error(`${mediaFiles.length - uploaded} photo(s) failed to upload`)
      } else {
        toast.success(`${uploaded} photo(s) uploaded`)
      }
    }

    router.push('/dashboard/my-listings')
  }

  const stepValid = () => {
    if (step === 1) return !!(form.category && form.listing_type)
    if (step === 2) return !!(form.title && form.price)
    if (step === 3) return !!form.region
    return true
  }

  const isBusy = create.isPending || uploadMedia.isPending

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
              <div
                title={label}
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
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Step {step} of {STEPS.length}: {STEPS[step - 1]}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEPS[step - 1]}</CardTitle>
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
              <div className="space-y-1.5">
                <Label>Description (Amharic) <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
                <Textarea value={form.description_am} onChange={(e) => update('description_am', e.target.value)} rows={2} placeholder="የአማርኛ መግለጫ" />
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
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.price_negotiable}
                  onChange={(e) => update('price_negotiable', e.target.checked)}
                  className="rounded"
                />
                Price is negotiable
              </label>

              {/* House fields */}
              {form.category === 'HOUSE' && (
                <div className="grid grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
                    <Label>Area (m²)</Label>
                    <Input type="number" value={form.area_sqm} onChange={(e) => update('area_sqm', e.target.value)} placeholder="120" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bedrooms</Label>
                    <Input type="number" min={0} value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} placeholder="3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bathrooms</Label>
                    <Input type="number" min={0} value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} placeholder="2" />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.furnished} onChange={(e) => update('furnished', e.target.checked)} className="rounded" />
                    Furnished
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.parking} onChange={(e) => update('parking', e.target.checked)} className="rounded" />
                    Parking included
                  </label>
                </div>
              )}

              {/* Car fields */}
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
                    <Label>Fuel Type</Label>
                    <Select value={form.fuel_type} onValueChange={(v) => { if (v) update('fuel_type', v) }}>
                      <SelectTrigger><SelectValue placeholder="Fuel" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PETROL">Petrol</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                        <SelectItem value="ELECTRIC">Electric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
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

              {/* Land fields */}
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
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.has_title_deed} onChange={(e) => update('has_title_deed', e.target.checked)} className="rounded" />
                    Has title deed
                  </label>
                </div>
              )}

              {/* Machine fields */}
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
                    <Label>Year</Label>
                    <Input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} placeholder="2020" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Operating Hours</Label>
                    <Input type="number" value={form.operating_hours} onChange={(e) => update('operating_hours', e.target.value)} placeholder="2000" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
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

          {/* Step 4: Photos & Videos */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload up to 10 images or videos. The first image becomes the main cover photo.
              </p>

              {/* Drop zone */}
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
                  <p className="text-sm font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, MP4 — max 10 files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {/* Preview grid */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaFiles.map((mf, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      {mf.file.type.startsWith('video/') ? (
                        <video
                          src={mf.preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <Image
                          src={mf.preview}
                          alt={`Photo ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      )}
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                          Cover
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                    >
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}

              {mediaFiles.length === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  No photos yet — you can skip and add them later from My Listings.
                </p>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium capitalize">{form.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{form.listing_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-medium truncate ml-4">{form.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-medium">ETB {Number(form.price).toLocaleString()}{form.price_unit ? ` ${form.price_unit}` : ''}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{form.region}{form.zone ? `, ${form.zone}` : ''}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Photos</span><span className="font-medium">{mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''}</span></div>
              </div>
              {mediaFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mediaFiles.map((mf, i) => (
                    <div key={i} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                      {mf.file.type.startsWith('video/') ? (
                        <video src={mf.preview} className="w-full h-full object-cover" muted />
                      ) : (
                        <Image src={mf.preview} alt="" fill className="object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
            {step < 5 ? (
              <Button onClick={next} disabled={!stepValid()}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isBusy}>
                {create.isPending ? 'Creating...' : uploadMedia.isPending ? 'Uploading photos...' : 'Publish Listing'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
