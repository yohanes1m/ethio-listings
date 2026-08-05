'use client'

import { useParams } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { CheckCircle, Heart, MessageCircle, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useListing } from '@/hooks/useListings'
import { useToggleFavorite } from '@/hooks/useFavorites'
import { useLanguageStore } from '@/store/languageStore'
import {
  getLocalizedTitle,
  getLocalizedDescription,
  formatPrice,
  whatsAppLink,
  telegramLink,
} from '@/lib/listingUtils'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: listing, isLoading } = useListing(id)
  const { language } = useLanguageStore()
  const { isSaved, toggle } = useToggleFavorite(id)
  const [activeImage, setActiveImage] = useState(0)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="aspect-[16/9] rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Listing not found.</p>
      </div>
    )
  }

  const title = getLocalizedTitle(listing, language)
  const description = getLocalizedDescription(listing, language)
  const price = formatPrice(listing.price, listing.price_unit)
  const broker = listing.user.broker_profile
  const images = listing.media.sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left — images + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          {images.length > 0 ? (
            <div className="space-y-2">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                <Image
                  src={images[activeImage]?.url ?? ''}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                />
                <button
                  onClick={toggle}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`}
                  />
                </button>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        activeImage === i ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image src={img.url} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              No images
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={listing.listing_type === 'SALE' ? 'default' : 'secondary'}>
              {listing.listing_type === 'SALE' ? 'For Sale' : 'For Rent'}
            </Badge>
            {listing.is_verified && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
            )}
            {listing.is_featured && (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                Featured
              </Badge>
            )}
          </div>

          {/* Title + price */}
          <div>
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            <p className="text-2xl font-bold text-primary mt-2 tabular-nums">{price}</p>
            {listing.price_negotiable && (
              <p className="text-sm text-muted-foreground">Price negotiable</p>
            )}
          </div>

          {/* Location */}
          {listing.location && (
            <div className="text-sm text-muted-foreground">
              📍{' '}
              {[
                listing.location.region,
                listing.location.zone,
                listing.location.woreda,
                listing.location.neighborhood,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Category-specific details */}
          <SpecTable listing={listing} />
        </div>

        {/* Right — broker contact */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-5 sticky top-20">
            <h2 className="font-semibold mb-4">Contact Broker</h2>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {listing.user.first_name[0]}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {listing.user.first_name} {listing.user.last_name}
                </p>
                <p className="text-xs text-muted-foreground">Broker</p>
              </div>
            </div>

            <div className="space-y-2">
              {broker?.whatsapp_phone && (
                <a
                  href={whatsAppLink(broker.whatsapp_phone, title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              )}
              {broker?.telegram_username && (
                <a
                  href={telegramLink(broker.telegram_username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Telegram
                  </Button>
                </a>
              )}
              {!broker?.whatsapp_phone && !broker?.telegram_username && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Contact info not available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SpecTable({ listing }: { listing: ReturnType<typeof useListing>['data'] }) {
  if (!listing) return null

  const rows: [string, string | number | boolean | null | undefined][] = []

  if (listing.house_details) {
    const h = listing.house_details
    rows.push(
      ['Type', h.house_type],
      ['Bedrooms', h.bedrooms],
      ['Bathrooms', h.bathrooms],
      ['Area', h.area_sqm ? `${h.area_sqm} m²` : null],
      ['Furnished', h.furnished ? 'Yes' : 'No'],
      ['Parking', h.parking ? 'Yes' : 'No'],
    )
  }

  if (listing.land_details) {
    const l = listing.land_details
    rows.push(
      ['Total Area', `${l.total_area} ${l.area_unit}`],
      ['Land Use', l.land_use],
      ['Title Deed', l.has_title_deed ? 'Yes' : 'No'],
      ['Road Access', l.road_access ? 'Yes' : 'No'],
    )
  }

  if (listing.car_details) {
    const c = listing.car_details
    rows.push(
      ['Make', c.make],
      ['Model', c.model],
      ['Year', c.year],
      ['Mileage', c.mileage_km ? `${c.mileage_km.toLocaleString()} km` : null],
      ['Transmission', c.transmission],
      ['Fuel', c.fuel_type],
      ['Condition', c.condition],
      ['Color', c.color],
    )
  }

  if (listing.machine_details) {
    const m = listing.machine_details
    rows.push(
      ['Type', m.machine_type],
      ['Manufacturer', m.manufacturer],
      ['Year', m.year],
      ['Condition', m.condition],
      ['Operating Hours', m.operating_hours],
    )
  }

  const visible = rows.filter(([, v]) => v != null && v !== '')
  if (visible.length === 0) return null

  return (
    <div>
      <h2 className="font-semibold mb-3">Specifications</h2>
      <div className="rounded-xl border border-border divide-y divide-border">
        {visible.map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium capitalize">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
