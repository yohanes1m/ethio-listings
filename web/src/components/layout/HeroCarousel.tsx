'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Home, MapPin, Car, Cog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/useTranslation'

const SLIDES = [
  {
    key: 'houses',
    Icon: Home,
    headline: 'Find your dream home',
    accent: 'in Ethiopia',
    sub: 'Houses · Apartments · Villas across all regions',
    bg: 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #fbbf24 100%)',
    orb1: 'rgba(251,191,36,0.30)',
    orb2: 'rgba(146,64,14,0.40)',
  },
  {
    key: 'lands',
    Icon: MapPin,
    headline: 'Own a piece of Ethiopian',
    accent: 'land',
    sub: 'Residential · Commercial · Agricultural plots',
    bg: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #6ee7b7 100%)',
    orb1: 'rgba(52,211,153,0.28)',
    orb2: 'rgba(6,78,59,0.45)',
  },
  {
    key: 'cars',
    Icon: Car,
    headline: 'Drive home in your',
    accent: 'perfect car',
    sub: 'New & used vehicles · All makes and models',
    bg: 'linear-gradient(135deg, #1e3a8a 0%, #4f46e5 50%, #a78bfa 100%)',
    orb1: 'rgba(167,139,250,0.25)',
    orb2: 'rgba(30,58,138,0.45)',
  },
  {
    key: 'machines',
    Icon: Cog,
    headline: 'Power your business with',
    accent: 'the right equipment',
    sub: 'Tractors · Generators · Construction machinery',
    bg: 'linear-gradient(135deg, #18181b 0%, #52525b 50%, #a1a1aa 100%)',
    orb1: 'rgba(161,161,170,0.22)',
    orb2: 'rgba(24,24,27,0.55)',
  },
] as const

const INTERVAL = 5000

export function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [q, setQ] = useState('')
  const [activeCategory, setActiveCategory] = useState('houses')
  const router = useRouter()
  const { t } = useTranslation()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const paused = useRef(false)
  const pointerStart = useRef<number | null>(null)

  const goTo = useCallback((idx: number) => {
    const clamped = (idx + SLIDES.length) % SLIDES.length
    setCurrent(clamped)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setActiveCategory(SLIDES[clamped]!.key)
  }, [])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!paused.current) {
      timerRef.current = setTimeout(() => { goTo(current + 1) }, INTERVAL)
    }
  }, [current, goTo])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [resetTimer])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/browse/${activeCategory}${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointerStart.current = e.clientX
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (pointerStart.current === null) return
    const delta = pointerStart.current - e.clientX
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev()
    pointerStart.current = null
  }

  return (
    <div className="relative">
      {/* Slides */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: 'clamp(440px, 58vh, 600px)' }}
        onMouseEnter={() => { paused.current = true; if (timerRef.current) clearTimeout(timerRef.current) }}
        onMouseLeave={() => { paused.current = false; resetTimer() }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {SLIDES.map((slide, i) => {
          const Icon = slide.Icon
          const isActive = i === current
          return (
            <div
              key={slide.key}
              className="absolute inset-0 flex flex-col items-center justify-center text-white select-none"
              style={{
                background: slide.bg,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.6s ease',
                pointerEvents: isActive ? 'auto' : 'none',
              }}
              aria-hidden={!isActive}
            >
              {/* Glowing orbs */}
              <div
                className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full blur-[80px] pointer-events-none"
                style={{ background: slide.orb1 }}
              />
              <div
                className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none"
                style={{ background: slide.orb2 }}
              />

              {/* Bottom fade for readability */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

              {/* Icon watermark */}
              <Icon
                className="mb-5 opacity-[0.12] drop-shadow-2xl"
                style={{ width: 'clamp(80px, 14vw, 140px)', height: 'clamp(80px, 14vw, 140px)' }}
                strokeWidth={0.8}
              />

              {/* Copy */}
              <div className="relative z-10 text-center px-6 pb-14">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3">
                  Ethiopia&apos;s #1 Marketplace
                </p>
                <h1
                  className="font-extrabold leading-[1.1] tracking-tight mb-2"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  {slide.headline}
                </h1>
                <h2
                  className="font-extrabold leading-[1.1] tracking-tight text-white/70 mb-4"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  {slide.accent}
                </h2>
                <p className="text-sm sm:text-base text-white/60 font-medium">
                  {slide.sub}
                </p>
              </div>
            </div>
          )
        })}

        {/* Arrows */}
        <button
          onClick={prev}
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                background: i === current ? 'white' : 'rgba(255,255,255,0.40)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Floating search box — overlaps hero bottom */}
      <div className="max-w-2xl mx-auto px-4 -mt-7 relative z-20">
        <form
          onSubmit={handleSearch}
          className="bg-card border border-border rounded-2xl p-3 shadow-2xl"
        >
          {/* Category tabs */}
          <div className="flex gap-1 mb-2.5">
            {SLIDES.map((slide) => {
              const Icon = slide.Icon
              const active = activeCategory === slide.key
              return (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(slide.key)
                    goTo(SLIDES.findIndex((s) => s.key === slide.key))
                  }}
                  className={`flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline capitalize">{slide.key}</span>
                </button>
              )
            })}
          </div>

          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('home.search_placeholder')}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button type="submit" className="shrink-0 px-5">
              {t('home.search_button')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
