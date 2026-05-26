'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuoteFormContext } from './QuoteFormContext'
import type { AutoFormState } from '@/app/types/autoForm'
import { INITIAL_FORM } from '@/app/types/form'
import type { FormState } from '@/app/types/form'
import { applyExtractedData } from '@/lib/applyAutofill'
import { loadGoogleMaps, type GoogleWindow } from '@/lib/googleMaps'
import { calcMilesToCoast, runPropertyLookups } from '@/lib/addressEnrichment'
import { Banner } from './Banner'
import { NotesSection } from './NotesSection'
import { AutofillPanel } from './AutofillPanel'
import { Section1 } from './Section1'
import { Section2 } from './Section2'
import { Section3 } from './Section3'
import { Section4 } from './Section4'
import { Section5 } from './Section5'
import { Section6 } from './Section6'
import { Section7 } from './Section7'
import { Section8 } from './Section8'
import { Section9 } from './Section9'
import { Section10 } from './Section10'
import { ActionBar } from './ActionBar'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export default function QuoteForm({
  autofillEnabled = false,
  sessionId,
}: {
  autofillEnabled?: boolean
  sessionId?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM, insureds: [{ ...INITIAL_FORM.insureds[0] }] })
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set())

  const update = useCallback((partial: Partial<FormState>) => {
    setForm(prev => {
      const next = { ...prev, ...partial }
      return next
    })
    setAutofilledFields(prev => {
      const keys = Object.keys(partial)
      if (!keys.some(k => prev.has(k))) return prev
      const next = new Set(prev)
      keys.forEach(k => next.delete(k))
      return next
    })
  }, [])

  const markAutofilled = useCallback((fields: string[]) => {
    setAutofilledFields(prev => new Set([...prev, ...fields]))
  }, [])

  const clearAutofilled = useCallback((fields: string[]) => {
    setAutofilledFields(prev => {
      if (!fields.some(f => prev.has(f))) return prev
      const next = new Set(prev)
      fields.forEach(f => next.delete(f))
      return next
    })
  }, [])

  // Auto-apply extracted data from an Outlook add-in session
  useEffect(() => {
    if (!sessionId) return

    async function applySession() {
      try {
        const res = await fetch(`/api/autofill/session?id=${sessionId}`)
        if (!res.ok) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const x: Record<string, any> = await res.json()

        // form is at initial state on first render — use INITIAL_FORM values
        const { updates, flashKeys } = applyExtractedData(x, INITIAL_FORM.insureds, '')
        if (Object.keys(updates).length > 0) {
          update(updates)
          markAutofilled(flashKeys)
        }

        // Geocode the subject address and run property lookups
        const street = x.subject_address as string | null
        const city   = x.subject_city   as string | null
        const state  = x.subject_state  as string | null
        const zip    = (x.subject_zip   as string | null) ?? ''
        if (GOOGLE_MAPS_API_KEY && street && city && state) {
          loadGoogleMaps(GOOGLE_MAPS_API_KEY).then(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ggl = (window as unknown as GoogleWindow)['google'] as any
            const geocoder = new ggl.maps.Geocoder()
            const fullAddr = [street, city, state, zip].filter(Boolean).join(', ')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            geocoder.geocode({ address: fullAddr }, (results: any[] | null, geocodeStatus: string) => {
              if (geocodeStatus !== 'OK' || !results?.[0]) return
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
              runPropertyLookups(lat, lng, street, city, state, zip, update, markAutofilled)
            })
          }).catch(() => {})
        }

        // Remove the session param from the URL so a refresh doesn't re-apply
        router.replace('/', { scroll: false })
      } catch {
        // Silent — user can still use the manual auto-fill panel
      }
    }

    applySession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [showCopyModal, setShowCopyModal] = useState(false)

  function clearForm() {
    if (!window.confirm('Clear all fields and start over?')) return
    setForm({ ...INITIAL_FORM, insureds: [{ ...INITIAL_FORM.insureds[0] }] })
    setAutofilledFields(new Set())
  }

  function copyToAuto() {
    const ins = form.insureds[0]
    const data: Partial<AutoFormState> = {
      agent:               form.agent,
      referred_by_name:    form.referred_by_name,
      referred_by_company: form.referred_by_company,
      new_purchase:        form.new_purchase,
      closing_date:        form.closing_date,
      sales_price:         form.sales_price,
      current_carrier:     form.current_carrier,
      premium:             form.premium,
      mail_street:         form.mail_street,
      mail_city:           form.mail_city,
      mail_state:          form.mail_state,
      mail_zip:            form.mail_zip,
      garaging_street:     form.prop_street,
      garaging_city:       form.prop_city,
      garaging_state:      form.prop_state,
      garaging_zip:        form.prop_zip,
      drivers: [{
        uid:                      1,
        secondary_named_insured:  false,
        first:    ins?.first    ?? '',
        middle:   ins?.middle   ?? '',
        last:     ins?.last     ?? '',
        suffix:   ins?.suffix   ?? '',
        dob:      ins?.dob      ?? '',
        ssn:      ins?.ssn      ?? '',
        marital:  ins?.marital  ?? '',
        occupation: ins?.occupation ?? '',
        phone:    ins?.phone    ?? '',
        email:    ins?.email    ?? '',
        license_number: '',
        license_state:  '',
        sr22:           '',
      }],
    }
    try {
      sessionStorage.setItem('copiedData', JSON.stringify(data))
    } catch { /* ignore */ }
    router.push('/auto')
  }

  return (
    <QuoteFormContext.Provider value={{ form, update, autofilledFields, markAutofilled, clearAutofilled }}>
      <div className="max-w-[980px] mx-auto px-4 pt-7 pb-20">
        <AutofillPanel onAutofill={markAutofilled} autofillEnabled={autofillEnabled} />
        <Banner />
        <NotesSection />
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
        <Section6 />
        <Section7 />
        <Section8 />
        <Section9 />
        {form.flood_quote === 'yes' && <Section10 />}

        {/* Copy to Another Sheet */}
        <div className="flex justify-center mt-2 mb-2 print:hidden">
          <button
            onClick={() => setShowCopyModal(true)}
            className="text-[13px] font-semibold text-navy/60 hover:text-navy border border-dashed border-navy/30 hover:border-navy rounded px-5 py-2 transition-colors"
          >
            Copy to Another Sheet…
          </button>
        </div>
      </div>
      <ActionBar onClear={clearForm} />

      {showCopyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-navy mb-2">Copy to Another Sheet</h2>
            <p className="text-[13px] text-gray-500 mb-5">
              Copy insured info, addresses, and file details to a new quote sheet.
            </p>
            <div className="space-y-2 mb-6">
              <button
                onClick={copyToAuto}
                className="w-full text-left bg-[#f7f4ee] hover:bg-[#f0ede8] border border-[#d0cdc8] rounded-lg px-4 py-3 transition-colors"
              >
                <div className="font-bold text-navy text-[14px]">Auto</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Copies insured info, mailing address, garaging address (from subject property), and referral info.</div>
              </button>
            </div>
            <button
              onClick={() => setShowCopyModal(false)}
              className="w-full border border-[#d0cdc8] rounded-lg py-2 text-[13px] text-gray-500 hover:bg-[#f7f4ee] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </QuoteFormContext.Provider>
  )
}
