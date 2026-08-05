'use client'

import { useCallback, useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import Link from 'next/link'
import { formatPrice } from '@/lib/listingUtils'

interface MapPin {
  id: string
  title: string
  title_am: string | null
  price: string | null
  category: string
  lat: string
  lng: string
}

interface Props {
  pins: MapPin[]
}

const CATEGORY_COLOR: Record<string, string> = {
  HOUSE: '#f59e0b',
  LAND: '#22c55e',
  CAR: '#3b82f6',
  MACHINE: '#8b5cf6',
}

export function ListingMap({ pins }: Props) {
  const [popup, setPopup] = useState<MapPin | null>(null)

  const handleMarkerClick = useCallback((pin: MapPin) => {
    setPopup(pin)
  }, [])

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-border">
      <Map
        initialViewState={{
          longitude: 38.74,
          latitude: 9.02,
          zoom: 11,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            longitude={parseFloat(pin.lng)}
            latitude={parseFloat(pin.lat)}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              handleMarkerClick(pin)
            }}
          >
            <button
              aria-label={pin.title}
              className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md text-white text-[10px] font-bold transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: CATEGORY_COLOR[pin.category] ?? '#f59e0b' }}
            >
              {pin.category[0]}
            </button>
          </Marker>
        ))}

        {popup && (
          <Popup
            longitude={parseFloat(popup.lng)}
            latitude={parseFloat(popup.lat)}
            anchor="top"
            onClose={() => setPopup(null)}
            closeButton
            closeOnClick={false}
            maxWidth="220px"
          >
            <div className="p-1 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {popup.category.toLowerCase()}
              </p>
              <p className="text-sm font-medium leading-snug line-clamp-2">{popup.title}</p>
              <p className="text-sm font-bold text-primary">
                {formatPrice(popup.price, null)}
              </p>
              <Link
                href={`/listings/${popup.id}`}
                className="block mt-2 text-center text-xs font-medium text-primary underline underline-offset-2"
              >
                View listing →
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
