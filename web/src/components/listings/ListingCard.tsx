'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useLanguageStore } from '@/store/languageStore'
import { useToggleFavorite } from '@/hooks/useFavorites'
import { useTranslation } from '@/lib/useTranslation'
import { getLocalizedTitle, getMainImage, formatPrice, whatsAppLink } from '@/lib/listingUtils'
import type { Listing } from '@/types/listing'

interface Props {
  listing: Listing
}

export function ListingCard({ listing }: Props) {
  const { language } = useLanguageStore()
  const { isSaved, toggle, isPending } = useToggleFavorite(listing.id)
  const { t } = useTranslation()
  const title = getLocalizedTitle(listing, language)
  const mainImage = getMainImage(listing)
  const price = formatPrice(listing.price, listing.price_unit)

  return (
    <article className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative aspect-[3/2] bg-muted overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge
            variant={listing.listing_type === 'SALE' ? 'default' : 'secondary'}
            className="text-[10px] px-2 py-0.5"
          >
            {listing.listing_type === 'SALE' ? t('listing.sale') : t('listing.rent')}
          </Badge>
          {listing.is_verified && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] px-2 py-0.5">
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              {t('listing.verified')}
            </Badge>
          )}
        </div>

        {/* Heart */}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggle()
          }}
          disabled={isPending}
          aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`}
          />
        </button>
      </div>

      {/* Body */}
      <Link href={`/listings/${listing.id}`} className="block p-3">
        {/* Price */}
        <p className="text-lg font-bold tabular-nums leading-tight">{price}</p>
        {listing.price_negotiable && (
          <p className="text-[10px] text-muted-foreground -mt-0.5">{t('listing.negotiable')}</p>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium mt-1.5 line-clamp-2 leading-snug">{title}</h3>

        {/* Location */}
        {listing.location && (
          <p className="text-xs text-muted-foreground mt-1">
            {[listing.location.region, listing.location.woreda].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Category chip */}
        <Badge variant="outline" className="mt-2 text-[10px] capitalize">
          {listing.category.toLowerCase()}
        </Badge>
      </Link>

      {/* WhatsApp */}
      {listing.broker_whatsapp && (
        <div className="px-3 pb-3">
          <a
            href={whatsAppLink(listing.broker_whatsapp, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium py-1.5 transition-colors"
          >
            <WhatsAppIcon />
            {t('listing.whatsapp')}
          </a>
        </div>
      )}
    </article>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.533 5.859L.057 23.25a.75.75 0 0 0 .916.916l5.391-1.476A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.946-1.353l-.353-.21-3.668 1.004 1.004-3.668-.21-.353A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  )
}
