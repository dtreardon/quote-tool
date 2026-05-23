'use client'

import { useEffect, useRef } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { loadGoogleMaps, getPlaceComponent, streetFromPlace, type AcInstance, type GoogleWindow } from '@/lib/googleMaps'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export function Section4() {
  const { form, update, autofilledFields } = useQuoteForm()
  const a = (key: string) => autofilledFields.has(key)

  const mailInputRef = useRef<HTMLInputElement>(null)
  const mailAcRef   = useRef<unknown>(null)
  const prevInputRef = useRef<HTMLInputElement>(null)
  const prevAcRef   = useRef<unknown>(null)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(() => {
      const google = (window as unknown as GoogleWindow)['google']
      const acOpts = {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components'],
      }

      if (mailInputRef.current && !mailAcRef.current) {
        const ac = new google.maps.places.Autocomplete(mailInputRef.current, acOpts)
        ;(ac as AcInstance).addListener('place_changed', () => {
          const place = (ac as AcInstance).getPlace()
          update({
            mail_street: streetFromPlace(place),
            mail_city:   getPlaceComponent(place, 'locality'),
            mail_state:  getPlaceComponent(place, 'administrative_area_level_1'),
            mail_zip:    getPlaceComponent(place, 'postal_code'),
          })
        })
        mailAcRef.current = ac
      }

      if (prevInputRef.current && !prevAcRef.current) {
        const ac = new google.maps.places.Autocomplete(prevInputRef.current, acOpts)
        ;(ac as AcInstance).addListener('place_changed', () => {
          const place = (ac as AcInstance).getPlace()
          update({
            prev_street: streetFromPlace(place),
            prev_city:   getPlaceComponent(place, 'locality'),
            prev_state:  getPlaceComponent(place, 'administrative_area_level_1'),
            prev_zip:    getPlaceComponent(place, 'postal_code'),
          })
        })
        prevAcRef.current = ac
      }
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSameAsSubject(checked: boolean) {
    if (checked) {
      update({
        mail_same_as_subject: true,
        mail_street: form.prop_street,
        mail_city: form.prop_city,
        mail_state: form.prop_state,
        mail_zip: form.prop_zip,
      })
    } else {
      update({ mail_same_as_subject: false })
    }
  }

  return (
    <SectionCard number={4} title="Other Addresses">
      <div className="mb-1 text-[11px] font-bold text-[#666] uppercase tracking-[0.05em]">Mailing Address</div>
      <div className="mb-3">
        <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
          <input
            type="checkbox"
            checked={form.mail_same_as_subject}
            onChange={e => handleSameAsSubject(e.target.checked)}
            className="accent-navy w-[15px] h-[15px]"
          />
          Same as Subject Property
        </label>
      </div>
      <div className="flex gap-3.5 flex-wrap mb-4">
        <Field label="Street Address" className="flex-[3] min-w-48" autofilled={a('mail_street')}>
          <input
            ref={mailInputRef}
            value={form.mail_street}
            onChange={e => update({ mail_street: e.target.value })}
            disabled={form.mail_same_as_subject}
            placeholder={GOOGLE_MAPS_API_KEY ? 'Start typing to search…' : ''}
            className={`${inputCls(a('mail_street'))} disabled:bg-gray-100 disabled:text-gray-400`}
          />
        </Field>
        <Field label="City" className="flex-[2] min-w-32" autofilled={a('mail_city')}>
          <input
            value={form.mail_city}
            onChange={e => update({ mail_city: e.target.value })}
            disabled={form.mail_same_as_subject}
            className={`${inputCls(a('mail_city'))} disabled:bg-gray-100 disabled:text-gray-400`}
          />
        </Field>
        <Field label="State" className="w-[60px]" autofilled={a('mail_state')} badgeOutside>
          <StateSelect
            value={form.mail_state}
            onChange={v => update({ mail_state: v })}
          />
        </Field>
        <Field label="ZIP" className="w-20" autofilled={a('mail_zip')}>
          <input
            value={form.mail_zip}
            onChange={e => update({ mail_zip: e.target.value })}
            maxLength={10}
            disabled={form.mail_same_as_subject}
            className={`${inputCls(a('mail_zip'))} disabled:bg-gray-100 disabled:text-gray-400`}
          />
        </Field>
      </div>

      <hr className="border-[#d0cdc8] mb-3" />
      <div className="mb-2 text-[11px] font-bold text-[#666] uppercase tracking-[0.05em]">Previous / Current Address</div>
      <div className="flex gap-3.5 flex-wrap">
        <Field label="Street Address" className="flex-[3] min-w-48" autofilled={a('prev_street')}>
          <input
            ref={prevInputRef}
            value={form.prev_street}
            onChange={e => update({ prev_street: e.target.value })}
            placeholder={GOOGLE_MAPS_API_KEY ? 'Start typing to search…' : ''}
            className={inputCls(a('prev_street'))}
          />
        </Field>
        <Field label="City" className="flex-[2] min-w-32" autofilled={a('prev_city')}>
          <input value={form.prev_city} onChange={e => update({ prev_city: e.target.value })} className={inputCls(a('prev_city'))} />
        </Field>
        <Field label="State" className="w-[60px]" autofilled={a('prev_state')} badgeOutside>
          <StateSelect value={form.prev_state} onChange={v => update({ prev_state: v })} />
        </Field>
        <Field label="ZIP" className="w-20" autofilled={a('prev_zip')}>
          <input value={form.prev_zip} onChange={e => update({ prev_zip: e.target.value })} maxLength={10} className={inputCls(a('prev_zip'))} />
        </Field>
      </div>
    </SectionCard>
  )
}
