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

export const metadata: Metadata = {
  title: 'EthioListings — Ethiopian Real Estate Marketplace',
  description:
    'Find houses, land, cars, and machines across Ethiopia. Powered by professional brokers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="am"
      className={`${inter.variable} ${notoSansEthiopic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
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
