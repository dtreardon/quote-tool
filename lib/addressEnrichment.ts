import { point, pointToLineDistance } from '@turf/turf'
import coastline from '@/data/coastline.json'
import type { FormState } from '@/app/types/form'

export function calcMilesToCoast(lat: number, lng: number): number {
  const propertyPoint = point([lng, lat])
  const filtered = (coastline as { features: Array<{ geometry: { coordinates: number[][] } }> }).features.filter(feat =>
    feat.geometry.coordinates.some(([fLng, fLat]) =>
      fLng >= -87 && fLng <= -75 && fLat >= 24 && fLat <= 37
    )
  )
  return filtered.length
    ? Math.min(...filtered.map(feat =>
        pointToLineDistance(propertyPoint, feat as Parameters<typeof pointToLineDistance>[1], { units: 'miles' })
      ))
    : 0
}

export function runPropertyLookups(
  lat: number,
  lng: number,
  street: string,
  city: string,
  state: string,
  zip: string,
  update: (partial: Partial<FormState>) => void,
  flash: (keys: string[]) => void
) {
  try {
    void fetch(`/api/property-details?${new URLSearchParams({ street, city, state, zip })}`)
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => {
        const keys = Object.keys(data)
        if (keys.length) { update(data as Partial<FormState>); flash(keys) }
      })
      .catch(() => {})
  } catch { /* ignore */ }

  try {
    void fetch('/api/fema-flood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: Record<string, string | null> | null) => {
        if (!data || data.floodZone == null) return
        const updates: Record<string, string> = {
          flood_zone:             data.floodZone as string,
          bfe:                    data.bfe             ?? '',
          firm_panel:             data.firmPanel       ?? '',
          firm_eff_date:          data.firmEffDate     ?? '',
          flood_zone_description: data.zoneDescription ?? '',
        }
        update(updates as Partial<FormState>)
        flash(Object.entries(updates).filter(([, v]) => v !== '').map(([k]) => k))
      })
      .catch(() => {})
  } catch { /* ignore */ }
}
