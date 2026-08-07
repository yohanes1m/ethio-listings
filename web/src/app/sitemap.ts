import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ethiolistings.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

async function fetchActiveListingIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/listings/public/?page_size=1000&status=ACTIVE`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const results: { id: string }[] = data.results ?? data
    return results.map((l) => l.id)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/browse/houses`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/browse/land`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/browse/cars`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/browse/machines`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const ids = await fetchActiveListingIds()
  const listingRoutes: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${SITE_URL}/listings/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...listingRoutes]
}
