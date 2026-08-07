import type { Language } from '@/store/languageStore'
import type { Listing } from '@/types/listing'

export function getLocalizedTitle(listing: Listing, lang: Language): string {
  if (lang === 'am') return listing.title_am ?? listing.title
  if (lang === 'om') return listing.title_om ?? listing.title_am ?? listing.title
  return listing.title ?? listing.title_am ?? ''
}

export function getLocalizedDescription(listing: Listing, lang: Language): string | null {
  if (lang === 'am') return listing.description_am ?? listing.description
  if (lang === 'om') return listing.description_om ?? listing.description_am ?? listing.description
  return listing.description ?? listing.description_am ?? null
}

export function getMainImage(listing: Listing): string | null {
  const media = listing.media ?? []
  // Prefer the flagged main image; fall back to first image-only media.
  // Videos cannot be passed to Next.js <Image> — skip them for card thumbnails.
  const main = media.find((m) => m.is_main && m.media_type === 'IMAGE')
  if (main) return main.url
  return media.find((m) => m.media_type === 'IMAGE')?.url ?? null
}

export function formatPrice(price: string | null, priceUnit: string | null): string {
  if (!price) return 'Price on request'
  const num = parseFloat(price)
  const formatted = new Intl.NumberFormat('en-ET').format(num)
  const suffix = priceUnit === 'per_month' ? '/mo' : priceUnit === 'per_year' ? '/yr' : ''
  return `ETB ${formatted}${suffix}`
}

export function whatsAppLink(phone: string, listingTitle: string): string {
  const msg = encodeURIComponent(`Hello, I'm interested in your listing: "${listingTitle}"`)
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${msg}`
}

export function telegramLink(username: string): string {
  return `https://t.me/${username.replace('@', '')}`
}
