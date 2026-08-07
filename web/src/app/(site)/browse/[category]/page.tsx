'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { LayoutGrid, Map, X } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

type Filters = Record<string, string>

function FilterSelect({
  label, filterKey, options, filters, set,
}: {
  label: string
  filterKey: string
  options: { value: string; label: string }[]
  filters: Filters
  set: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={filters[filterKey] ?? 'ALL'} onValueChange={(v) => set(filterKey, v === 'ALL' ? '' : v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Any</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function ToggleFilter({ label, filterKey, filters, set }: {
  label: string; filterKey: string; filters: Filters; set: (k: string, v: string) => void
}) {
  const active = filters[filterKey] === 'true'
  return (
    <button
      onClick={() => set(filterKey, active ? '' : 'true')}
      className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function HouseFilters({ filters, set }: { filters: Filters; set: (k: string, v: string) => void }) {
  return (
    <>
      <FilterSelect
        label="Min bedrooms"
        filterKey="bedrooms_min"
        filters={filters}
        set={set}
        options={[
          { value: '1', label: '1+' },
          { value: '2', label: '2+' },
          { value: '3', label: '3+' },
          { value: '4', label: '4+' },
        ]}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Amenities</Label>
        <div className="flex gap-2 flex-wrap">
          <ToggleFilter label="Furnished" filterKey="furnished" filters={filters} set={set} />
          <ToggleFilter label="Parking" filterKey="parking" filters={filters} set={set} />
        </div>
      </div>
    </>
  )
}

function CarFilters({ filters, set }: { filters: Filters; set: (k: string, v: string) => void }) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Make</Label>
        <Input
          className="h-8 text-xs"
          placeholder="Toyota, Hyundai…"
          value={filters.make ?? ''}
          onChange={(e) => set('make', e.target.value)}
        />
      </div>
      <FilterSelect
        label="Fuel"
        filterKey="fuel_type"
        filters={filters}
        set={set}
        options={[
          { value: 'PETROL', label: 'Petrol' },
          { value: 'DIESEL', label: 'Diesel' },
          { value: 'HYBRID', label: 'Hybrid' },
          { value: 'ELECTRIC', label: 'Electric' },
        ]}
      />
      <FilterSelect
        label="Transmission"
        filterKey="transmission"
        filters={filters}
        set={set}
        options={[
          { value: 'MANUAL', label: 'Manual' },
          { value: 'AUTOMATIC', label: 'Automatic' },
        ]}
      />
      <FilterSelect
        label="Condition"
        filterKey="condition"
        filters={filters}
        set={set}
        options={[
          { value: 'NEW', label: 'New' },
          { value: 'EXCELLENT', label: 'Excellent' },
          { value: 'GOOD', label: 'Good' },
          { value: 'FAIR', label: 'Fair' },
        ]}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Year from</Label>
        <Input
          className="h-8 text-xs"
          type="number"
          placeholder="2015"
          value={filters.year_min ?? ''}
          onChange={(e) => set('year_min', e.target.value)}
        />
      </div>
    </>
  )
}

function LandFilters({ filters, set }: { filters: Filters; set: (k: string, v: string) => void }) {
  return (
    <>
      <FilterSelect
        label="Land use"
        filterKey="land_use"
        filters={filters}
        set={set}
        options={[
          { value: 'RESIDENTIAL', label: 'Residential' },
          { value: 'COMMERCIAL', label: 'Commercial' },
          { value: 'AGRICULTURAL', label: 'Agricultural' },
          { value: 'MIXED', label: 'Mixed' },
        ]}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Features</Label>
        <div className="flex gap-2 flex-wrap">
          <ToggleFilter label="Title deed" filterKey="has_title_deed" filters={filters} set={set} />
          <ToggleFilter label="Road access" filterKey="road_access" filters={filters} set={set} />
        </div>
      </div>
    </>
  )
}

function MachineFilters({ filters, set }: { filters: Filters; set: (k: string, v: string) => void }) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Machine type</Label>
        <Input
          className="h-8 text-xs"
          placeholder="Tractor, Generator…"
          value={filters.machine_type ?? ''}
          onChange={(e) => set('machine_type', e.target.value)}
        />
      </div>
      <FilterSelect
        label="Condition"
        filterKey="condition"
        filters={filters}
        set={set}
        options={[
          { value: 'NEW', label: 'New' },
          { value: 'USED', label: 'Used' },
          { value: 'RECONDITIONED', label: 'Reconditioned' },
        ]}
      />
    </>
  )
}

export default function BrowsePage() {
  const params = useParams<{ category: string }>()
  const searchParams = useSearchParams()
  const category = (params.category as Category) ?? 'houses'
  const apiCategory = CATEGORY_MAP[category] ?? 'HOUSE'

  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [filters, setFilters] = useState<Filters>({})
  const [page, setPage] = useState(1)

  const { data: regionsData } = useRegions()
  const regions = regionsData ?? []

  const qParam = searchParams.get('q')

  function setFilter(key: string, value: string) {
    setFilters((prev) => {
      if (!value) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: value }
    })
    setPage(1)
  }

  const activeFilters = Object.keys(filters).filter((k) => filters[k])
  const hasFilters = activeFilters.length > 0

  const { data, isLoading } = usePublicListings({
    category: apiCategory,
    ...filters,
    ...(qParam ? { q: qParam } : {}),
    page,
  })

  const { data: mapPins } = useMapPins(view === 'map' ? apiCategory : undefined)
  const listings = data?.results ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Category nav */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={`/browse/${cat}`} onClick={() => setFilters({})}>
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

      {/* Shared filters row */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={filters.listing_type ?? 'ALL'}
            onValueChange={(v) => setFilter('listing_type', v === 'ALL' ? '' : v)}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SALE">For Sale</SelectItem>
              <SelectItem value="RENT">For Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Region</Label>
          <Select
            value={filters.region ?? 'ALL'}
            onValueChange={(v) => setFilter('region', v === 'ALL' ? '' : v)}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Regions</SelectItem>
              {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Category-specific filters inline */}
        {apiCategory === 'HOUSE' && <HouseFilters filters={filters} set={setFilter} />}
        {apiCategory === 'CAR' && <CarFilters filters={filters} set={setFilter} />}
        {apiCategory === 'LAND' && <LandFilters filters={filters} set={setFilter} />}
        {apiCategory === 'MACHINE' && <MachineFilters filters={filters} set={setFilter} />}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => { setFilters({}); setPage(1) }}
          >
            <X className="w-3 h-3" />
            Clear
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
