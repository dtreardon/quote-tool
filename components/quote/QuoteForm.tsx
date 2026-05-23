'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuoteFormContext } from './QuoteFormContext'
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
      if (partial.year_built && !prev.reno_roof && !('reno_roof' in partial)) {
        next.reno_roof = partial.year_built
      }
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

  function clearForm() {
    if (!window.confirm('Clear all fields and start over?')) return
    setForm({ ...INITIAL_FORM, insureds: [{ ...INITIAL_FORM.insureds[0] }] })
    setAutofilledFields(new Set())
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
      </div>
      <ActionBar onClear={clearForm} />
    </QuoteFormContext.Provider>
  )
}
