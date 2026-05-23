'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { loadGoogleMaps, getPlaceComponent, streetFromPlace, type AcInstance, type GoogleWindow } from '@/lib/googleMaps'
import { calcMilesToCoast, runPropertyLookups } from '@/lib/addressEnrichment'
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export function Section3() {
  const { form, update, autofilledFields, markAutofilled } = useQuoteForm()
  const a = (key: string) => autofilledFields.has(key)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<unknown>(null)
  const [showSatellite, setShowSatellite] = useState(false)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(() => {
      if (!inputRef.current || autocompleteRef.current) return
      const google = (window as unknown as GoogleWindow)['google']
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

        const dist = calcMilesToCoast(lat, lng)

        const street = streetFromPlace(place)
        const city   = getPlaceComponent(place, 'locality')
        const state  = getPlaceComponent(place, 'administrative_area_level_1')
        const zip    = getPlaceComponent(place, 'postal_code')
        const countyRaw = getPlaceComponent(place, 'administrative_area_level_2')

        update({
          prop_street: street,
          prop_city: city,
          prop_state: state,
          prop_zip: zip,
          prop_county: countyRaw.replace(' County', ''),
          prop_lat: lat,
          prop_lng: lng,
          miles_coast: Number(dist.toFixed(2)).toString(),
        })

        runPropertyLookups(lat, lng, street, city, state, zip, update, markAutofilled)
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
              onChange={e => update({ prop_street: e.target.value, prop_zip: '', prop_city: '', prop_state: '', prop_county: '', prop_lat: null, prop_lng: null })}
              className={inputCls(a('prop_street'))}
              placeholder={GOOGLE_MAPS_API_KEY ? 'Start typing to search…' : ''}
            />
          </Field>
          <Field label="City" className="flex-[2] min-w-32" autofilled={a('prop_city')}>
            <input value={form.prop_city} onChange={e => update({ prop_city: e.target.value })} className={inputCls(a('prop_city'))} />
          </Field>
          <Field label="State" className="w-[60px]" autofilled={a('prop_state')} badgeOutside>
            <StateSelect value={form.prop_state} onChange={v => update({ prop_state: v })} />
          </Field>
          <Field label="ZIP" className="w-20" autofilled={a('prop_zip')}>
            <input value={form.prop_zip} onChange={e => update({ prop_zip: e.target.value })} maxLength={10} className={inputCls(a('prop_zip'))} />
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
