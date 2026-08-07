import type { Metadata } from 'next'
import { ListingDetailClient } from './ListingDetailClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ethiolistings.com'

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
  car_details?: {
    make?: string | null
    model?: string | null
    year?: number | null
    mileage_km?: number | null
    fuel_type?: string | null
    transmission?: string | null
    condition?: string | null
  } | null
  house_details?: {
    house_type?: string | null
    bedrooms?: number | null
    bathrooms?: number | null
    area_sqm?: number | null
  } | null
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const listing = await fetchListingMeta(id)
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

  const categoryLabel = listing.category
    ? `${listing.category[0]}${listing.category.slice(1).toLowerCase()}`
    : 'property'
  const keywords = [
    `${categoryLabel} ${typeLabel.toLowerCase()} Ethiopia`,
    `${categoryLabel} ${typeLabel.toLowerCase()} ${location}`,
    `Ethiopia ${categoryLabel} marketplace`,
    `EthioListings ${categoryLabel}`,
  ].filter(Boolean)

  return {
    title: ogTitle,
    description: ogDesc,
    keywords,
    alternates: { canonical: `${SITE_URL}/listings/${id}` },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      type: 'article',
      url: `${SITE_URL}/listings/${id}`,
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

function buildJsonLd(id: string, listing: ListingMeta): object {
  const title = listing.title ?? listing.title_en ?? 'Listing'
  const desc = listing.description ?? listing.description_en ?? ''
  const location = listing.location
    ? [listing.location.region, listing.location.zone].filter(Boolean).join(', ')
    : 'Ethiopia'
  const price = listing.price ? parseFloat(listing.price) : undefined
  const mainImage = listing.media?.find((m) => m.is_main && m.media_type === 'IMAGE')?.url
    ?? listing.media?.find((m) => m.media_type === 'IMAGE')?.url

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: listing.category ? `${listing.category[0]}${listing.category.slice(1).toLowerCase()}s` : 'Listings',
        item: `${SITE_URL}/browse/${listing.category?.toLowerCase() ?? 'houses'}`,
      },
      { '@type': 'ListItem', position: 3, name: title, item: `${SITE_URL}/listings/${id}` },
    ],
  }

  const offerProps = {
    '@type': 'Offer',
    priceCurrency: 'ETB',
    ...(price != null ? { price: price.toFixed(2) } : {}),
    availability: 'https://schema.org/InStock',
    areaServed: { '@type': 'Country', name: 'Ethiopia' },
  }

  let itemLd: object

  if (listing.category === 'CAR' && listing.car_details) {
    const cd = listing.car_details
    itemLd = {
      '@context': 'https://schema.org',
      '@type': 'Car',
      name: title,
      description: desc,
      ...(mainImage ? { image: mainImage } : {}),
      url: `${SITE_URL}/listings/${id}`,
      ...(cd.make ? { brand: { '@type': 'Brand', name: cd.make } } : {}),
      ...(cd.model ? { model: cd.model } : {}),
      ...(cd.year ? { modelDate: String(cd.year) } : {}),
      ...(cd.mileage_km != null
        ? { mileageFromOdometer: { '@type': 'QuantitativeValue', value: cd.mileage_km, unitCode: 'KMT' } }
        : {}),
      ...(cd.fuel_type ? { fuelType: cd.fuel_type } : {}),
      ...(cd.transmission ? { vehicleTransmission: cd.transmission } : {}),
      offers: offerProps,
    }
  } else if (listing.category === 'HOUSE' && listing.house_details) {
    const hd = listing.house_details
    itemLd = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: title,
      description: desc,
      ...(mainImage ? { image: mainImage } : {}),
      url: `${SITE_URL}/listings/${id}`,
      address: { '@type': 'PostalAddress', addressLocality: location, addressCountry: 'ET' },
      ...(hd.bedrooms != null ? { numberOfBedrooms: hd.bedrooms } : {}),
      ...(hd.bathrooms != null ? { numberOfBathroomsTotal: hd.bathrooms } : {}),
      ...(hd.area_sqm != null
        ? { floorSize: { '@type': 'QuantitativeValue', value: hd.area_sqm, unitCode: 'MTK' } }
        : {}),
      offers: offerProps,
    }
  } else {
    itemLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
      description: desc,
      ...(mainImage ? { image: mainImage } : {}),
      url: `${SITE_URL}/listings/${id}`,
      offers: offerProps,
    }
  }

  return { breadcrumb, item: itemLd }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await fetchListingMeta(id)
  const jsonLd = listing ? buildJsonLd(id, listing) : null

  return (
    <>
      {jsonLd && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify((jsonLd as { breadcrumb: object }).breadcrumb) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify((jsonLd as { item: object }).item) }}
          />
        </>
      )}
      <ListingDetailClient id={id} />
    </>
  )
}
