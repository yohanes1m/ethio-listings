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
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80&fit=crop',
    tint: 'rgba(120, 53, 15, 0.50)',
  },
  {
    key: 'lands',
    Icon: MapPin,
    headline: 'Own a piece of Ethiopian',
    accent: 'land',
    sub: 'Residential · Commercial · Agricultural plots',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80&fit=crop',
    tint: 'rgba(6, 78, 59, 0.52)',
  },
  {
    key: 'cars',
    Icon: Car,
    headline: 'Drive home in your',
    accent: 'perfect car',
    sub: 'New & used vehicles · All makes and models',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80&fit=crop',
    tint: 'rgba(15, 23, 42, 0.55)',
  },
  {
    key: 'machines',
    Icon: Cog,
    headline: 'Power your business with',
    accent: 'the right equipment',
    sub: 'Tractors · Generators · Construction machinery',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80&fit=crop',
    tint: 'rgba(28, 25, 23, 0.55)',
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
  const currentRef = useRef(current)
  useEffect(() => { currentRef.current = current }, [current])

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + SLIDES.length) % SLIDES.length)
  }, [])

  const next = useCallback(() => goTo(currentRef.current + 1), [goTo])
  const prev = useCallback(() => goTo(currentRef.current - 1), [goTo])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!paused.current) goTo(currentRef.current + 1)
    }, INTERVAL)
  }, [goTo])

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, startTimer])

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
    <>
      {/* Ken Burns keyframe */}
      <style>{`
        @keyframes kenBurns {
          from { transform: scale(1); }
          to   { transform: scale(1.08); }
        }
        .kb-active { animation: kenBurns ${INTERVAL}ms ease-out forwards; }
      `}</style>

      <div className="relative">
        {/* Slides */}
        <div
          className="relative overflow-hidden"
          style={{ minHeight: 'clamp(460px, 60vh, 620px)' }}
          onMouseEnter={() => { paused.current = true; if (timerRef.current) clearTimeout(timerRef.current) }}
          onMouseLeave={() => { paused.current = false; startTimer() }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {SLIDES.map((slide, i) => {
            const Icon = slide.Icon
            const isActive = i === current
            return (
              <div
                key={slide.key}
                className="absolute inset-0 flex flex-col items-center justify-center text-white select-none overflow-hidden"
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.7s ease',
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                aria-hidden={!isActive}
              >
                {/* Photo with Ken Burns zoom */}
                <div
                  key={isActive ? `${slide.key}-active` : slide.key}
                  className={`absolute inset-0 bg-cover bg-center ${isActive ? 'kb-active' : ''}`}
                  style={{ backgroundImage: `url(${slide.image})` }}
                />

                {/* Category color tint */}
                <div className="absolute inset-0" style={{ background: slide.tint }} />

                {/* Dark vignette: strong at bottom for text, subtle at top */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/70 pointer-events-none" />

                {/* Icon watermark — centered, large, ghosted */}
                <Icon
                  className="mb-4 text-white/[0.10] drop-shadow-2xl relative z-10"
                  style={{ width: 'clamp(72px, 12vw, 128px)', height: 'clamp(72px, 12vw, 128px)' }}
                  strokeWidth={0.75}
                />

                {/* Copy */}
                <div className="relative z-10 text-center px-6 pb-16 max-w-3xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50 mb-3">
                    Ethiopia&apos;s #1 Marketplace
                  </p>
                  <h1
                    className="font-extrabold leading-[1.08] tracking-tight mb-1.5 text-white drop-shadow-lg"
                    style={{ fontSize: 'clamp(1.9rem, 5vw, 3.5rem)' }}
                  >
                    {slide.headline}
                  </h1>
                  <h2
                    className="font-extrabold leading-[1.08] tracking-tight mb-4 text-white/75 drop-shadow-lg"
                    style={{ fontSize: 'clamp(1.9rem, 5vw, 3.5rem)' }}
                  >
                    {slide.accent}
                  </h2>
                  <p className="text-sm sm:text-base text-white/55 font-medium tracking-wide">
                    {slide.sub}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '28px' : '8px',
                  height: '8px',
                  background: i === current ? 'white' : 'rgba(255,255,255,0.35)',
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Floating search card */}
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
                    onClick={() => setActiveCategory(slide.key)}
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
    </>
  )
}
