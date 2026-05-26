'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { loadGoogleMaps, getPlaceComponent, streetFromPlace, type AcInstance, type GoogleWindow } from '@/lib/googleMaps'
import { calcMilesToCoast, runPropertyLookups } from '@/lib/addressEnrichment'
import { INITIAL_FORM } from '@/app/types/form'
import type { FormState } from '@/app/types/form'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// All fields populated by enrichment lookups — reset to initial values on every address change
// so stale data from the previous address never bleeds into the new one.
// update() automatically clears autofill amber indicators for every key it receives.
const ENRICHMENT_RESET: Partial<FormState> = {
  // ZLLW property details
  year_built: '', sqft: '', beds: '', full_baths: '', half_baths: '',
  num_stories: '', roof_type: '', construction_type: '', foundation_type: '',
  garage_type: '', garage_cars: INITIAL_FORM.garage_cars,
  heat_air: '', fireplaces: INITIAL_FORM.fireplaces,
  pool: '', burglar_alarm: '', gated: '',
  // FEMA flood
  flood_zone: '', bfe: '', firm_panel: '', firm_eff_date: '', flood_zone_description: '',
  // Geocoding
  prop_lat: null, prop_lng: null, miles_coast: '', prop_county: '',
}

export function Section3() {
  const { form, update, updateIfEmpty, autofilledFields, markAutofilled } = useQuoteForm()
  const a = (key: string) => autofilledFields.has(key)
  const inputRef        = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<unknown>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geocoderRef     = useRef<any>(null)
  // Tracks the last street||zip we ran enrichment for — prevents double-firing when
  // Google Maps autocomplete selection is followed immediately by a blur event.
  const lastEnrichedRef = useRef('')
  const [showSatellite, setShowSatellite] = useState(false)

  // Geocode a manually-entered address, then run all three lookups.
  // No-ops if we already ran enrichment for this street+zip combination.
  function triggerManualEnrich(street: string, city: string, state: string, zip: string) {
    if (!street || !zip || !geocoderRef.current) return
    const key = `${street}||${zip}`
    if (key === lastEnrichedRef.current) return
    lastEnrichedRef.current = key

    // Clear stale data immediately (amber indicators cleared by update())
    update({ ...ENRICHMENT_RESET })

    const fullAddr = [street, city, state, zip].filter(Boolean).join(', ')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geocoderRef.current.geocode({ address: fullAddr }, (results: any[], status: string) => {
      if (status !== 'OK' || !results?.[0]) return
      const r = results[0]
      const lat: number = r.geometry.location.lat()
      const lng: number = r.geometry.location.lng()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countyComp = r.address_components?.find((c: any) =>
        c.types.includes('administrative_area_level_2')
      )
      const county: string = countyComp
        ? (countyComp.long_name as string).replace(' County', '')
        : ''
      const dist = calcMilesToCoast(lat, lng)
      update({
        prop_lat:    lat,
        prop_lng:    lng,
        miles_coast: Number(dist.toFixed(2)).toString(),
        ...(county ? { prop_county: county } : {}),
      })
      markAutofilled(['miles_coast', ...(county ? ['prop_county'] : [])])
      runPropertyLookups(lat, lng, street, city, state, zip, update, markAutofilled, updateIfEmpty)
    })
  }

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as unknown as GoogleWindow)['google'] as any

      // Store geocoder once for re-use in manual-entry blur handlers
      if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder()

      if (!inputRef.current || autocompleteRef.current) return
      const ac = new google.maps.places.Autocomplete(inputRef.current!, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'geometry'],
      })
      ;(ac as AcInstance).addListener('place_changed', () => {
        const place = (ac as AcInstance).getPlace()
        const geometry = place?.geometry as { location?: { lat: () => number; lng: () => number } } | undefined
        const lat = geometry?.location?.lat()
        const lng = geometry?.location?.lng()
        if (lat == null || lng == null) return

        const dist    = calcMilesToCoast(lat, lng)
        const street  = streetFromPlace(place)
        const city    = getPlaceComponent(place, 'locality')
        const state   = getPlaceComponent(place, 'administrative_area_level_1')
        const zip     = getPlaceComponent(place, 'postal_code')
        const county  = getPlaceComponent(place, 'administrative_area_level_2').replace(' County', '')

        lastEnrichedRef.current = `${street}||${zip}`

        // One update clears all stale enrichment data, sets the new address + geo fields,
        // and removes all amber autofill indicators in a single React commit.
        update({
          ...ENRICHMENT_RESET,
          prop_street: street,
          prop_city:   city,
          prop_state:  state,
          prop_zip:    zip,
          prop_county: county,
          prop_lat:    lat,
          prop_lng:    lng,
          miles_coast: Number(dist.toFixed(2)).toString(),
        })
        markAutofilled(['miles_coast', ...(county ? ['prop_county'] : [])])
        runPropertyLookups(lat, lng, street, city, state, zip, update, markAutofilled, updateIfEmpty)
      })
      autocompleteRef.current = ac
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasLocation = form.prop_lat !== null && form.prop_lng !== null
  const fullAddress = [form.prop_street, form.prop_city, form.prop_state, form.prop_zip].filter(Boolean).join(', ')
  const zillowSlug = [form.prop_street, form.prop_city, form.prop_state, form.prop_zip]
    .filter(Boolean).join(' ').replace(/[,\s]+/g, '-')

  return (
    <>
      <SectionCard number={3} title="Subject Property Address">
        {!GOOGLE_MAPS_API_KEY && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
            Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code>.env.local</code> to enable address autocomplete.
          </p>
        )}
        <div className="flex gap-3.5 flex-wrap">
          <Field label="Street Address" className="flex-[3] min-w-48" autofilled={a('prop_street')}>
            <input
              ref={inputRef}
              value={form.prop_street}
              onChange={e => update({
                prop_street: e.target.value,
                prop_zip: '', prop_city: '', prop_state: '', prop_county: '',
                prop_lat: null, prop_lng: null,
              })}
              onBlur={e => {
                const street = e.target.value.trim()
                if (street && form.prop_zip)
                  triggerManualEnrich(street, form.prop_city, form.prop_state, form.prop_zip)
              }}
              className={inputCls(a('prop_street'))}
              placeholder={GOOGLE_MAPS_API_KEY ? 'Start typing to search…' : ''}
            />
          </Field>
          <Field label="City" className="flex-[2] min-w-32" autofilled={a('prop_city')}>
            <input value={form.prop_city} onChange={e => update({ prop_city: e.target.value })} className={inputCls(a('prop_city'))} />
          </Field>
          <Field label="State" className="w-[60px]" autofilled={a('prop_state')} badgeRight="right-7">
            <StateSelect value={form.prop_state} onChange={v => update({ prop_state: v })} autofilled={a('prop_state')} />
          </Field>
          <Field label="ZIP" className="w-20" autofilled={a('prop_zip')}>
            <input
              value={form.prop_zip}
              onChange={e => update({ prop_zip: e.target.value })}
              maxLength={10}
              onBlur={e => {
                const zip = e.target.value.trim()
                if (form.prop_street && zip)
                  triggerManualEnrich(form.prop_street, form.prop_city, form.prop_state, zip)
              }}
              className={inputCls(a('prop_zip'))}
            />
          </Field>
          <Field label="County" className="w-36" autofilled={a('prop_county')}>
            <input value={form.prop_county} onChange={e => update({ prop_county: e.target.value })} placeholder="Auto-filled" className={`${inputCls(a('prop_county'))} bg-gray-50`} />
          </Field>
        </div>

        {hasLocation && (
          <div className="flex gap-2 mt-3 print:hidden">
            <button
              type="button"
              onClick={() => setShowSatellite(true)}
              className="px-2.5 py-1 text-[12px] font-semibold border border-[#d0cdc8] rounded text-navy bg-white hover:bg-[#f0ede8] transition-colors"
            >
              View Satellite
            </button>
            <a
              href={`https://www.zillow.com/homes/${zillowSlug}_rb/`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-[12px] font-semibold border border-[#d0cdc8] rounded text-navy bg-white hover:bg-[#f0ede8] transition-colors"
            >
              View on Zillow
            </a>
          </div>
        )}
      </SectionCard>

      {showSatellite && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 print:hidden"
          onClick={() => setShowSatellite(false)}
        >
          <div
            className="bg-white rounded-lg overflow-hidden shadow-2xl"
            style={{ width: 820, maxWidth: '95vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-navy">
              <span className="text-white text-[13px] font-semibold truncate">{fullAddress}</span>
              <button
                type="button"
                onClick={() => setShowSatellite(false)}
                className="ml-4 flex-shrink-0 text-white/60 hover:text-white text-lg leading-none transition-colors"
              >
                ✕
              </button>
            </div>
            <iframe
              src={`https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${form.prop_lat},${form.prop_lng}&zoom=19&maptype=satellite`}
              width="100%"
              height="520"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </>
  )
}
