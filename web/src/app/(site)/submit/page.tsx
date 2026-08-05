'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { useRegions, useWoredas } from '@/hooks/useLocations'
import { useSubmit } from '@/hooks/useSubmissions'

type Step = 1 | 2 | 3 | 4

const STEPS = ['Category', 'Details', 'Location', 'Contact']

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
    owner_phone: '',
    owner_whatsapp: '',
  })
  const router = useRouter()
  const { data: regions } = useRegions()
  const { data: woredas } = useWoredas(form.zone)
  const submit = useSubmit()

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateDetail(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }))
  }

  function next() {
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s))
  }

  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
  }

  async function handleSubmit() {
    await submit.mutateAsync({
      category: form.category,
      listing_type: form.listing_type,
      region: form.region,
      zone: form.zone || undefined,
      woreda: form.woreda || undefined,
      owner_phone: form.owner_phone,
      ...(form.owner_whatsapp ? { owner_whatsapp: form.owner_whatsapp } : {}),
      details: form.details,
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
            </>
          )}

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
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Woreda / Area</Label>
                <Input
                  value={form.woreda}
                  onChange={(e) => update('woreda', e.target.value)}
                  placeholder="e.g. Bole, Kirkos"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Address <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={String(form.details.address ?? '')}
                  onChange={(e) => updateDetail('address', e.target.value)}
                  placeholder="Street, building, landmark..."
                />
              </div>
            </>
          )}

          {step === 4 && (
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
                  {form.woreda ? `, ${form.woreda}` : ''}
                </p>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={back}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 4 ? (
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
