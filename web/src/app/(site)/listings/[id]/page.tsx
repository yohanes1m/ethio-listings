import type { Metadata } from 'next'
import { ListingDetailClient } from './ListingDetailClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

interface ListingMeta {
  title: string | null
  title_en: string | null
  description: string | null
  description_en: string | null
  price: string | null
  price_unit: string | null
  category: string | null
  listing_type: string | null
  is_verified: boolean
  location?: { region: string | null; zone: string | null } | null
  media?: { url: string; is_main: boolean; media_type: string }[]
}

async function fetchListingMeta(id: string): Promise<ListingMeta | null> {
  try {
    const res = await fetch(`${API_URL}/listings/${id}/`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json() as Promise<ListingMeta>
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = await fetchListingMeta(params.id)
  if (!listing) {
    return { title: 'Listing not found — EthioListings' }
  }

  const title = listing.title ?? listing.title_en ?? 'Listing'
  const desc = listing.description ?? listing.description_en ?? ''
  const location = listing.location
    ? [listing.location.region, listing.location.zone].filter(Boolean).join(', ')
    : ''
  const typeLabel = listing.listing_type === 'SALE' ? 'For Sale' : 'For Rent'
  const mainImage = listing.media?.find((m) => m.is_main && m.media_type === 'IMAGE')?.url
    ?? listing.media?.find((m) => m.media_type === 'IMAGE')?.url

  const ogTitle = `${title}${location ? ` — ${location}` : ''} | EthioListings`
  const ogDesc = desc
    ? desc.slice(0, 160)
    : `${listing.category ?? ''} ${typeLabel.toLowerCase()}${listing.price ? ` · ETB ${parseFloat(listing.price).toLocaleString('en-ET')}` : ''}${location ? ` · ${location}` : ''}`

  return {
    title: ogTitle,
    description: ogDesc,
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      type: 'article',
      ...(mainImage ? { images: [{ url: mainImage, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDesc,
      ...(mainImage ? { images: [mainImage] } : {}),
    },
  }
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  return <ListingDetailClient id={params.id} />
}
