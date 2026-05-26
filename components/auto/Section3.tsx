'use client'

import { useEffect, useRef } from 'react'
import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { loadGoogleMaps, type GoogleWindow } from '@/lib/googleMaps'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

function AddressBlock({
  label,
  streetKey,
  cityKey,
  stateKey,
  zipKey,
}: {
  label: string
  streetKey: 'garaging_street' | 'mail_street'
  cityKey: 'garaging_city' | 'mail_city'
  stateKey: 'garaging_state' | 'mail_state'
  zipKey: 'garaging_zip' | 'mail_zip'
}) {
  const { form, update, autofilledFields } = useAutoForm()
  const a = (k: string) => autofilledFields.has(k)
  const streetRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !streetRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let autocomplete: any
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ggl = (window as unknown as GoogleWindow)['google'] as any
      autocomplete = new ggl.maps.places.Autocomplete(streetRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components'],
      })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place?.address_components) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const get = (type: string) => place.address_components.find((c: any) => c.types.includes(type))
        const streetNum = get('street_number')?.long_name || ''
        const route     = get('route')?.short_name || ''
        const city      = get('locality')?.long_name || get('sublocality_level_1')?.long_name || ''
        const state     = get('administrative_area_level_1')?.short_name || ''
        const zip       = get('postal_code')?.long_name || ''
        update({
          [streetKey]: [streetNum, route].filter(Boolean).join(' '),
          [cityKey]: city,
          [stateKey]: state,
          [zipKey]: zip,
        } as Partial<typeof form>)
      })
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] mb-2">{label}</div>
      <div className="flex gap-3.5 flex-wrap mb-2">
        <Field label="Street Address" className="flex-[3] min-w-48" autofilled={a(streetKey)}>
          <input
            ref={streetRef}
            value={form[streetKey]}
            onChange={e => update({ [streetKey]: e.target.value } as Partial<typeof form>)}
            className={inputCls(a(streetKey))}
          />
        </Field>
        <Field label="City" className="flex-[2] min-w-36" autofilled={a(cityKey)}>
          <input value={form[cityKey]} onChange={e => update({ [cityKey]: e.target.value } as Partial<typeof form>)} className={inputCls(a(cityKey))} />
        </Field>
        <Field label="State" className="w-20" autofilled={a(stateKey)} badgeRight="right-7">
          <StateSelect value={form[stateKey]} onChange={v => update({ [stateKey]: v } as Partial<typeof form>)} autofilled={a(stateKey)} />
        </Field>
        <Field label="ZIP" className="w-24" autofilled={a(zipKey)}>
          <input value={form[zipKey]} onChange={e => update({ [zipKey]: e.target.value } as Partial<typeof form>)} maxLength={10} className={inputCls(a(zipKey))} />
        </Field>
      </div>
    </div>
  )
}

export function Section3() {
  const { form, update } = useAutoForm()

  return (
    <SectionCard number={3} title="Garaging & Mailing Addresses">
      <AddressBlock
        label="Garaging Address (where vehicle is primarily kept)"
        streetKey="garaging_street"
        cityKey="garaging_city"
        stateKey="garaging_state"
        zipKey="garaging_zip"
      />

      <div className="mt-4">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-navy cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={form.mail_same_as_garaging}
            onChange={e => update({ mail_same_as_garaging: e.target.checked })}
            className="w-4 h-4 accent-navy"
          />
          Mailing address same as garaging address
        </label>

        {!form.mail_same_as_garaging && (
          <AddressBlock
            label="Mailing Address"
            streetKey="mail_street"
            cityKey="mail_city"
            stateKey="mail_state"
            zipKey="mail_zip"
          />
        )}
      </div>
    </SectionCard>
  )
}
