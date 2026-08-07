import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ethiolistings.com'

const CATEGORY_META: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  houses: {
    title: 'Houses & Apartments for Sale and Rent in Ethiopia',
    description:
      'Browse verified houses, villas, apartments, and studios for sale and rent across Ethiopia. Find your home in Addis Ababa, Dire Dawa, Hawassa, and all regions.',
    keywords: [
      'houses for rent Ethiopia',
      'apartments for sale Addis Ababa',
      'villa for sale Ethiopia',
      'studio apartment rent Addis Ababa',
      'rent house Addis Ababa',
      'buy house Ethiopia',
      'real estate Addis Ababa',
      'ቤት ኪራይ አዲስ አበባ',
      'ቤት ሽያጭ ኢትዮጵያ',
      'apartment rent Bole',
      'house for sale Kazanchis',
      'furnished apartment Addis Ababa',
    ],
  },
  land: {
    title: 'Land for Sale in Ethiopia — Residential, Commercial & Agricultural',
    description:
      'Find land for sale across Ethiopia including residential plots, commercial land, and agricultural land. Browse verified listings with title deed in Addis Ababa and all regions.',
    keywords: [
      'land for sale Ethiopia',
      'plot for sale Addis Ababa',
      'commercial land Ethiopia',
      'agricultural land Ethiopia',
      'ቦታ ሽያጭ ኢትዮጵያ',
      'ቦታ ሽያጭ አዲስ አበባ',
      'residential plot Ethiopia',
      'land with title deed Ethiopia',
      'land for sale Oromia',
      'land sale Dire Dawa',
    ],
  },
  cars: {
    title: 'Cars for Sale in Ethiopia — New & Used Vehicles',
    description:
      'Buy and sell new and used cars in Ethiopia. Browse Toyota, Hyundai, Nissan, and more. Filter by make, model, year, and fuel type. Verified listings across Ethiopia.',
    keywords: [
      'cars for sale Ethiopia',
      'used cars Addis Ababa',
      'Toyota for sale Ethiopia',
      'Land Cruiser Ethiopia',
      'car buy Ethiopia',
      'vehicle sale Addis Ababa',
      'መኪና ሽያጭ ኢትዮጵያ',
      'new car Ethiopia',
      'Hyundai for sale Ethiopia',
      'pickup truck Ethiopia',
      'SUV for sale Addis Ababa',
    ],
  },
  machines: {
    title: 'Machinery & Equipment for Sale in Ethiopia',
    description:
      'Buy and sell construction machinery, agricultural equipment, generators, and industrial machines in Ethiopia. Verified listings with broker contact.',
    keywords: [
      'machinery for sale Ethiopia',
      'construction equipment Ethiopia',
      'generator for sale Ethiopia',
      'tractor for sale Ethiopia',
      'excavator Ethiopia',
      'industrial equipment Addis Ababa',
      'agricultural machinery Ethiopia',
      'ማሽን ሽያጭ ኢትዮጵያ',
    ],
  },
}

const DEFAULT_META = {
  title: 'Browse Listings in Ethiopia',
  description: 'Browse verified property, vehicle, and machinery listings across Ethiopia.',
  keywords: ['listings Ethiopia', 'buy sell rent Ethiopia', 'EthioListings'],
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const meta = CATEGORY_META[category] ?? DEFAULT_META

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `${SITE_URL}/browse/${category}` },
    openGraph: {
      title: `${meta.title} | EthioListings`,
      description: meta.description,
      url: `${SITE_URL}/browse/${category}`,
      type: 'website',
    },
  }
}

export default function BrowseCategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
