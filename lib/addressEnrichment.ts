import { point, pointToLineDistance } from '@turf/turf'
import coastline from '@/data/coastline.json'
import { homeUpdatedPatch, type FormState } from '@/app/types/form'

// FEMA NFHL fields — cleared together whenever the subject address changes
export const FLOOD_RESET: Partial<FormState> = {
  flood_zone: '', bfe: '', firm_panel: '', firm_eff_date: '', flood_zone_description: '',
}

// Special Flood Hazard Areas (1% annual chance) — lender will likely require flood coverage
const SFHA_ZONES = new Set(['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'])

export function isSpecialFloodHazardArea(zone: string | null | undefined): boolean {
  return !!zone && SFHA_ZONES.has(zone.trim().toUpperCase())
}

// Incremented whenever lookups start or the subject address is replaced, so a slow
// geocode / ZLLW / FEMA response for a previous address (or a previous sheet, before
// a Recall) can never land on the current one.
let lookupSeq = 0

export function currentLookupGeneration() {
  return lookupSeq
}

// Call when the subject address changes (or a sheet is recalled) without a new
// lookup being fired yet, so any in-flight responses for the old address are discarded.
export function cancelPendingLookups() {
  lookupSeq++
}

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
  markAutofilled: (keys: string[]) => void,
  updateIfEmpty: (partial: Partial<FormState>) => void
) {
  const seq = ++lookupSeq
  try {
    void fetch(`/api/property-details?${new URLSearchParams({ street, city, state, zip })}`)
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => {
        if (seq !== lookupSeq) return
        const keys = Object.keys(data)
        if (keys.length) {
          if (data.year_built && !data.reno_roof) data.reno_roof = data.year_built
          updateIfEmpty(data as Partial<FormState>)
          // home_updated defaults to "no" (not empty), so it is switched explicitly
          const homeUpdated = homeUpdatedPatch(data as Partial<FormState>)
          if (homeUpdated.home_updated) update(homeUpdated)
          markAutofilled(keys)
        }
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
        if (seq !== lookupSeq) return
        if (!data || data.floodZone == null) return
        const updates: Record<string, string> = {
          flood_zone:             data.floodZone as string,
          bfe:                    data.bfe             ?? '',
          firm_panel:             data.firmPanel       ?? '',
          firm_eff_date:          data.firmEffDate     ?? '',
          flood_zone_description: data.zoneDescription ?? '',
        }
        update(updates as Partial<FormState>)
        markAutofilled(Object.entries(updates).filter(([, v]) => v !== '').map(([k]) => k))
      })
      .catch(() => {})
  } catch { /* ignore */ }
}
