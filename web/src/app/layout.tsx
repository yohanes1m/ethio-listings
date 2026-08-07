import type { Metadata } from 'next'
import { Inter, Noto_Sans_Ethiopic } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/providers/QueryProvider'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: '--font-noto-ethiopic',
  subsets: ['ethiopic'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ethiolistings.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EthioListings — Buy, Sell & Rent Property, Cars & Land in Ethiopia',
    template: '%s | EthioListings',
  },
  description:
    'Ethiopia\'s trusted marketplace to buy, sell, and rent houses, apartments, land, cars, and machinery. Browse verified listings across Addis Ababa, Dire Dawa, Hawassa, and all regions.',
  keywords: [
    'houses for rent in Ethiopia',
    'apartments for sale in Addis Ababa',
    'land for sale in Ethiopia',
    'cars for sale Ethiopia',
    'real estate Ethiopia',
    'property for sale Addis Ababa',
    'rent house Addis Ababa',
    'ቤት ኪራይ አዲስ አበባ',
    'ቤት ሽያጭ',
    'ቦታ ሽያጭ',
    'Ethiopian real estate marketplace',
    'buy house Ethiopia',
    'rent apartment Ethiopia',
    'commercial property Ethiopia',
    'villa for sale Addis Ababa',
    'machinery for sale Ethiopia',
    'EthioListings',
  ],
  authors: [{ name: 'EthioListings', url: SITE_URL }],
  creator: 'EthioListings',
  publisher: 'EthioListings',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_ET',
    url: SITE_URL,
    siteName: 'EthioListings',
    title: 'EthioListings — Buy, Sell & Rent Property, Cars & Land in Ethiopia',
    description:
      'Ethiopia\'s trusted marketplace for houses, apartments, land, cars, and machinery. Verified listings across all Ethiopian regions.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'EthioListings — Ethiopia Property & Vehicle Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@EthioListings',
    title: 'EthioListings — Buy, Sell & Rent in Ethiopia',
    description: 'Ethiopia\'s trusted marketplace for property, cars, land, and machinery.',
    images: ['/og-default.jpg'],
  },
  alternates: { canonical: SITE_URL },
}

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'EthioListings',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: ['https://t.me/EthioListings'],
  areaServed: { '@type': 'Country', name: 'Ethiopia' },
  description:
    'Ethiopia\'s trusted marketplace for buying, selling, and renting houses, land, cars, and machinery.',
}

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'EthioListings',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/browse/houses?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansEthiopic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: 'var(--font-inter)' },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
