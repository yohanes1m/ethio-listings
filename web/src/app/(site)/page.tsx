'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { HeroCarousel } from '@/components/layout/HeroCarousel'
import { useFeaturedListings, usePlatformStats } from '@/hooks/useListings'
import { useTranslation } from '@/lib/useTranslation'

const HOW_IT_WORKS_KEYS = [
  { step: '01', titleKey: 'home.steps.submit.title', descKey: 'home.steps.submit.description' },
  { step: '02', titleKey: 'home.steps.broker.title', descKey: 'home.steps.broker.description' },
  { step: '03', titleKey: 'home.steps.published.title', descKey: 'home.steps.published.description' },
]

export default function HomePage() {
  const { data: featured, isLoading: featuredLoading } = useFeaturedListings()
  const { data: stats } = usePlatformStats()
  const { t } = useTranslation()

  return (
    <div>
      {/* ── Hero carousel ── */}
      <HeroCarousel />

      {/* ── Stats strip ── */}
      <section className="border-b border-border bg-muted/40 py-6 px-4 mt-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { labelKey: 'home.stats.listings', value: stats?.active_listings },
            { labelKey: 'home.stats.brokers', value: stats?.brokers },
            { labelKey: 'home.stats.regions', value: stats?.regions_covered },
            { labelKey: 'home.stats.deals', value: stats?.deals_closed },
          ].map(({ labelKey, value }) => (
            <div key={labelKey}>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {value != null ? value.toLocaleString() + '+' : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-xl font-semibold mb-6">{t('home.featured_title')}</h2>
        <ListingGrid
          listings={featured ?? []}
          isLoading={featuredLoading}
          emptyMessage={t('common.no_results')}
        />
        <div className="mt-8 text-center">
          <Link href="/browse/houses">
            <Button variant="outline">{t('nav.browse')} →</Button>
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-muted/40 border-t border-border py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-10">{t('home.how_it_works_title')}</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS_KEYS.map(({ step, titleKey, descKey }) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold mb-1">{t(titleKey)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">{t('home.cta_title')}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {t('home.cta_subtitle')}
        </p>
        <Link href="/submit">
          <Button size="lg">{t('home.cta_button')} →</Button>
        </Link>
      </section>
    </div>
  )
}
