'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { LayoutGrid, Map } from 'lucide-react'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { Pagination } from '@/components/ui/pagination'
import { usePublicListings, useMapPins } from '@/hooks/useListings'
import { useRegions } from '@/hooks/useLocations'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const ListingMap = dynamic(
  () => import('@/components/listings/ListingMap').then((m) => m.ListingMap),
  { ssr: false, loading: () => <div className="w-full h-[600px] rounded-xl bg-muted animate-pulse" /> }
)

const CATEGORIES = ['houses', 'lands', 'cars', 'machines'] as const
type Category = (typeof CATEGORIES)[number]

const CATEGORY_MAP: Record<Category, string> = {
  houses: 'HOUSE',
  lands: 'LAND',
  cars: 'CAR',
  machines: 'MACHINE',
}

const PAGE_SIZE = 20

export default function BrowsePage() {
  const params = useParams<{ category: string }>()
  const searchParams = useSearchParams()
  const category = (params.category as Category) ?? 'houses'
  const apiCategory = CATEGORY_MAP[category] ?? 'HOUSE'

  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [listingType, setListingType] = useState<string>('ALL')
  const [region, setRegion] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const { data: regionsData } = useRegions()
  const regions = regionsData ?? []

  const qParam = searchParams.get('q')
  const { data, isLoading } = usePublicListings({
    category: apiCategory,
    ...(listingType !== 'ALL' ? { listing_type: listingType } : {}),
    ...(region !== 'ALL' ? { region } : {}),
    ...(qParam ? { q: qParam } : {}),
    page,
  })

  const { data: mapPins } = useMapPins(view === 'map' ? apiCategory : undefined)

  const listings = data?.results ?? []

  function handleFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setter(v)
      setPage(1)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Category nav */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={`/browse/${cat}`}>
            <Button
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              className="capitalize shrink-0"
            >
              {cat}
            </Button>
          </Link>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={listingType} onValueChange={(v) => { if (v) handleFilterChange(setListingType)(v) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="SALE">For Sale</SelectItem>
            <SelectItem value="RENT">For Rent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={region} onValueChange={(v) => { if (v) handleFilterChange(setRegion)(v) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(listingType !== 'ALL' || region !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setListingType('ALL')
              setRegion('ALL')
              setPage(1)
            }}
          >
            Clear filters
          </Button>
        )}

        {/* Grid / Map toggle */}
        <div className="ml-auto flex items-center gap-1 border border-border rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Count */}
      {!isLoading && data && (
        <p className="text-sm text-muted-foreground mb-4">
          {data.count} listing{data.count !== 1 ? 's' : ''}
          {data.count > PAGE_SIZE && (
            <span> — page {page} of {Math.ceil(data.count / PAGE_SIZE)}</span>
          )}
        </p>
      )}

      {view === 'grid' ? (
        <>
          <ListingGrid
            listings={listings}
            isLoading={isLoading}
            emptyMessage={`No ${category} listings found. Try removing filters.`}
          />
          {data && (
            <Pagination
              page={page}
              count={data.count}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                setPage(p)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </>
      ) : (
        <ListingMap pins={mapPins ?? []} />
      )}
    </div>
  )
}
