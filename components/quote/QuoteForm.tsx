'use client'
import { Fragment, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QuoteFormContext } from './QuoteFormContext'
import type { AutoFormState } from '@/app/types/autoForm'
import { INITIAL_FORM } from '@/app/types/form'
import type { FormState } from '@/app/types/form'
import { applyExtractedData } from '@/lib/applyAutofill'
import { loadSavedAgent } from '@/lib/agentMemory'
import { MORTGAGEE_MEMORY_KEYS, normalizeCompany, type MortgageeMemory } from '@/lib/mortgageeMemory'
import { loadGoogleMaps, type GoogleWindow } from '@/lib/googleMaps'
import { calcMilesToCoast, runPropertyLookups, cancelPendingLookups, currentLookupGeneration } from '@/lib/addressEnrichment'
import { restoreHOForm } from '@/lib/restoreSheet'
import type { SheetPayload } from '@/lib/sheetData'
import { RecallButton, takeRecallHandoff } from '../ui/RecallButton'
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

  // Like update(), but only sets fields whose current value is empty.
  // Used for async property lookups so manually entered data is never overwritten.
  const updateIfEmpty = useCallback((partial: Partial<FormState>) => {
    setForm(prev => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(partial)) {
        const key = k as keyof FormState
        if (prev[key] === null || prev[key] === undefined || prev[key] === '') (next as Record<string, unknown>)[key] = v
      }
      return next
    })
  }, [])

  // Latest form for async callbacks (mortgagee lookup) that resolve after later edits
  const formRef = useRef(form)
  useEffect(() => { formRef.current = form }, [form])

  // Recall: replaces the whole sheet with a saved one. No lookups fire — pending
  // ones are cancelled, and the sections below are remounted (keyed on restoreCount)
  // so no local state (eligibility results, enrichment de-dupe keys, uid-keyed rows)
  // carries over from the previous sheet. Restored values get no check circles.
  const [restoreCount, setRestoreCount] = useState(0)
  const restoreCountRef = useRef(0)
  const restoreSheet = useCallback((payload: SheetPayload) => {
    cancelPendingLookups()
    restoreCountRef.current++
    setForm(restoreHOForm(payload.form as Partial<FormState>))
    setAutofilledFields(new Set())
    setRestoreCount(restoreCountRef.current)
  }, [])

  const isDirty = useCallback(() =>
    JSON.stringify(formRef.current) !== JSON.stringify({ ...INITIAL_FORM, agent: formRef.current.agent }),
  [])

  // Mortgagee memory: when Referred By Company is populated and the clause is
  // completely empty, fill it from the last saved sheet for that company.
  // Only empty fields are filled; failures are silent.
  const lookupMortgagee = useCallback((company: string) => {
    if (!normalizeCompany(company)) return
    if (MORTGAGEE_MEMORY_KEYS.some(k => formRef.current[k])) return
    const sheetGen = restoreCountRef.current
    fetch(`/api/mortgagee-memory?${new URLSearchParams({ company })}`)
      .then(r => r.ok ? r.json() : {})
      .then((m: Partial<MortgageeMemory>) => {
        if (!m.mortgagee_name) return
        if (sheetGen !== restoreCountRef.current) return // a different sheet was recalled meanwhile
        // Re-check: the agent or auto-fill may have started the clause meanwhile
        if (MORTGAGEE_MEMORY_KEYS.some(k => formRef.current[k])) return
        const patch: Partial<FormState> = {}
        for (const k of MORTGAGEE_MEMORY_KEYS) if (m[k]) patch[k] = m[k]
        updateIfEmpty(patch)
        setForm(prev => ({ ...prev, mortgagee_open: true }))
        markAutofilled(Object.keys(patch))
      })
      .catch(() => {})
  }, [updateIfEmpty, markAutofilled])

  // New blank sheet — default the Agent to the last one picked on this browser.
  // Runs after mount (localStorage isn't available during SSR).
  useEffect(() => {
    const saved = loadSavedAgent()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage after hydration
    if (saved) setForm(prev => prev.agent ? prev : { ...prev, agent: saved })

    // HO sheet recalled from the Auto sheet's Recall button
    const handoff = takeRecallHandoff('HO')
    if (handoff) restoreSheet(handoff)
  }, [restoreSheet])

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
        if (updates.referred_by_company) lookupMortgagee(updates.referred_by_company)

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
            const gen = currentLookupGeneration()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            geocoder.geocode({ address: fullAddr }, (results: any[] | null, geocodeStatus: string) => {
              if (gen !== currentLookupGeneration()) return
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
              runPropertyLookups(lat, lng, street, city, state, zip, update, markAutofilled, updateIfEmpty)
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
    setForm({ ...INITIAL_FORM, insureds: [{ ...INITIAL_FORM.insureds[0] }], agent: loadSavedAgent() })
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
    <QuoteFormContext.Provider value={{ form, update, updateIfEmpty, autofilledFields, markAutofilled, clearAutofilled, lookupMortgagee }}>
      {/* Screen layout mirrors the PDF on wide screens: everything else on the left,
          Rating / Coverage / Quotes in a sticky right panel. Below xl the column wrappers
          are display:contents and the order-* classes restore the single-column sequence
          (…, 5, 6, 7, 8, 9, 10). Print uses buildPrintHTML, so it is unaffected. */}
      <div className="max-w-[980px] xl:max-w-[1440px] mx-auto px-4 pt-7 pb-20 flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-x-5 xl:items-start">
        <div className="contents xl:block xl:min-w-0">
          <div className="order-1">
            <AutofillPanel
              onAutofill={markAutofilled}
              autofillEnabled={autofillEnabled}
              recall={<RecallButton sheet="HO" isDirty={isDirty} onRestore={restoreSheet} />}
            />
          </div>
          <Fragment key={restoreCount}>
            <div className="order-2"><Banner /></div>
            <div className="order-3"><NotesSection /></div>
            <div className="order-4"><Section1 /></div>
            <div className="order-5"><Section2 /></div>
            <div className="order-6"><Section3 /></div>
            <div className="order-7"><Section4 /></div>
            <div className="order-8"><Section5 /></div>
            <div className="order-10"><Section7 /></div>
            {form.flood_quote === 'yes' && <div className="order-[13]"><Section10 /></div>}
          </Fragment>

          {/* Copy to Another Sheet */}
          <div className="order-[14] flex justify-center mt-2 mb-2 print:hidden">
            <button
              onClick={() => setShowCopyModal(true)}
              className="text-[13px] font-semibold text-navy/60 hover:text-navy border border-dashed border-navy/30 hover:border-navy rounded px-5 py-2 transition-colors"
            >
              Copy to Another Sheet…
            </button>
          </div>
        </div>

        {/* Right panel — sticky below the site header; scrolls on its own when taller
            than the space between the header and the bottom action bar */}
        <aside className="contents xl:block xl:sticky xl:top-[var(--qsp-header-h)] xl:max-h-[calc(100vh-var(--qsp-header-h)-var(--qsp-actionbar-h))] xl:overflow-y-auto xl:overflow-x-hidden xl:overscroll-contain xl:pr-1">
          <Fragment key={restoreCount}>
            <div className="order-11 xl:order-none"><Section8 /></div>
            <div className="order-9 xl:order-none"><Section6 /></div>
            <div className="order-12 xl:order-none"><Section9 /></div>
          </Fragment>
        </aside>
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
