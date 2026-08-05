export type ListingType = 'SALE' | 'RENT'
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'RENTED' | 'EXPIRED'
export type ListingCategory = 'HOUSE' | 'LAND' | 'CAR' | 'MACHINE'

export interface ListingMedia {
  id: string
  url: string
  is_main: boolean
  order: number
  media_type: 'IMAGE' | 'VIDEO'
}

export interface Location {
  region: string
  zone: string | null
  woreda: string | null
  neighborhood: string | null
  address: string | null
  lat: string | null
  lng: string | null
}

export interface BrokerProfile {
  telegram_username: string | null
  whatsapp_phone: string | null
}

export interface ListingUser {
  id: string
  first_name: string
  last_name: string
  broker_profile?: BrokerProfile | null
}

export interface HouseDetails {
  house_type: string
  bedrooms: number | null
  bathrooms: number | null
  area_sqm: string | null
  furnished: boolean
  parking: boolean
}

export interface LandDetails {
  total_area: string
  area_unit: string
  land_use: string
  has_title_deed: boolean
  road_access: boolean
}

export interface CarDetails {
  make: string
  model: string
  year: number | null
  mileage_km: number | null
  transmission: string
  fuel_type: string
  condition: string
  color: string | null
}

export interface MachineDetails {
  machine_type: string
  manufacturer: string | null
  year: number | null
  condition: string
  operating_hours: number | null
}

export interface Listing {
  id: string
  title: string
  title_am: string | null
  title_om: string | null
  description: string | null
  description_am: string | null
  description_om: string | null
  listing_type: ListingType
  price: string | null
  price_negotiable: boolean
  price_unit: string | null
  status: ListingStatus
  category: ListingCategory
  is_verified: boolean
  is_featured: boolean
  view_count: number
  broker_whatsapp: string | null
  broker_telegram: string | null
  location?: Location | null
  media: ListingMedia[]
  house_details?: HouseDetails | null
  land_details?: LandDetails | null
  car_details?: CarDetails | null
  machine_details?: MachineDetails | null
  created_at: string
  updated_at: string
}

export interface MapPin {
  id: string
  title: string
  title_am: string | null
  price: string | null
  category: string
  lat: string
  lng: string
}

export interface PaginatedListings {
  count: number
  next: string | null
  previous: string | null
  results: Listing[]
}

export interface PlatformStats {
  active_listings: number
  brokers: number
  regions_covered: number
  deals_closed: number
}
