'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { useFeaturedListings, usePlatformStats } from '@/hooks/useListings'

const CATEGORIES = [
  { key: 'houses', label: 'ቤቶች', labelEn: 'Houses', emoji: '🏠' },
  { key: 'lands', label: 'መሬቶች', labelEn: 'Land', emoji: '🌿' },
  { key: 'cars', label: 'መኪናዎች', labelEn: 'Cars', emoji: '🚗' },
  { key: 'machines', label: 'ማሽኖች', labelEn: 'Machines', emoji: '⚙️' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Submit Your Property',
    titleAm: 'ንብረትዎን ያስረክቡ',
    desc: 'Fill in the details and submit a listing request. Free, takes 2 minutes.',
  },
  {
    step: '02',
    title: 'A Broker Contacts You',
    titleAm: 'ደላላ ያገኛሉ',
    desc: 'Our professional brokers review your request, verify details, and reach out.',
  },
  {
    step: '03',
    title: 'Your Listing Goes Live',
    titleAm: 'ዝርዝርዎ ይታተማል',
    desc: 'Once approved, your property is published and buyers start seeing it.',
  },
]

export default function HomePage() {
  const [q, setQ] = useState('')
  const [activeCategory, setActiveCategory] = useState('houses')
  const router = useRouter()
  const { data: featured, isLoading: featuredLoading } = useFeaturedListings()
  const { data: stats } = usePlatformStats()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/browse/${activeCategory}?q=${encodeURIComponent(q)}`)
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            ቀጣዩን ንብረትዎን ይፈልጉ
          </h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Find your next property in Ethiopia
          </p>

          {/* Search box */}
          <form
            onSubmit={handleSearch}
            className="bg-card border border-border rounded-2xl p-2 shadow-sm"
          >
            {/* Category tabs */}
            <div className="flex gap-1 mb-2 px-1">
              {CATEGORIES.map(({ key, emoji, labelEn }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                    activeCategory === key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="hidden sm:inline">{labelEn}</span>
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search location, title, or type..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button type="submit" className="shrink-0">
                ፈልግ
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b border-border bg-muted/40 py-6 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Active Listings', value: stats?.active_listings },
            { label: 'Brokers', value: stats?.brokers },
            { label: 'Regions', value: stats?.regions_covered },
            { label: 'Deals Closed', value: stats?.deals_closed },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {value != null ? value.toLocaleString() + '+' : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-xl font-semibold mb-6">ተመራጭ ዝርዝሮች</h2>
        <ListingGrid
          listings={featured ?? []}
          isLoading={featuredLoading}
          emptyMessage="No featured listings yet."
        />
        <div className="mt-8 text-center">
          <Link href="/browse/houses">
            <Button variant="outline">View all listings</Button>
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-muted/40 border-t border-border py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-10">እንዴት ይሠራል</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, titleAm, desc }) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold mb-1">{titleAm}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">ንብረትዎን ይዘርዝሩ</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Contact a broker today — free, fast, professional.
        </p>
        <Link href="/submit">
          <Button size="lg">Get Started →</Button>
        </Link>
      </section>
    </div>
  )
}
