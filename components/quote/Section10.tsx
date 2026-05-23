'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'
import { DollarInput } from '../ui/DollarInput'
import type { QuoteData } from '@/app/types/form'

let nextFloodQuoteUid = 2

function blankFloodQuote(): QuoteData {
  return { uid: nextFloodQuoteUid++, carrier: '', premium: '' }
}

export function Section10() {
  const { form, update, autofilledFields } = useQuoteForm()
  const a = (key: string) => autofilledFields.has(key)

  function addFloodQuote() {
    update({ flood_quotes: [...form.flood_quotes, blankFloodQuote()] })
  }

  function removeFloodQuote(uid: number) {
    update({ flood_quotes: form.flood_quotes.filter(q => q.uid !== uid) })
  }

  function updateFloodQuote(uid: number, patch: Partial<QuoteData>) {
    update({ flood_quotes: form.flood_quotes.map(q => q.uid === uid ? { ...q, ...patch } : q) })
  }

  return (
    <SectionCard number={10} title="Flood Information">
      {/* Row 1: Flood Zone, BFE, Elevation Certificate, Flood Type */}
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Flood Zone" className="w-28" autofilled={a('flood_zone')}>
          <input
            value={form.flood_zone}
            onChange={e => update({ flood_zone: e.target.value })}
            placeholder="Auto-filled"
            className={`${inputCls()} bg-gray-50`}
          />
        </Field>
        <Field label="BFE" className="w-24" autofilled={a('bfe')}>
          <input
            value={form.bfe}
            onChange={e => update({ bfe: e.target.value })}
            placeholder="Auto-filled"
            className={`${inputCls()} bg-gray-50`}
          />
        </Field>
        <Field label="Elevation Certificate?">
          <YesNo name="elevation_cert" value={form.elevation_cert} onChange={v => update({ elevation_cert: v })} />
        </Field>
        <Field label="Flood Type" className="flex-1 min-w-40">
          <select value={form.flood_type} onChange={e => update({ flood_type: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            <option>Loan Closing</option>
            <option>Standard Wait</option>
            <option>Rewrite</option>
          </select>
        </Field>
      </div>

      {/* Row 2: FIRM Panel, FIRM Effective Date, Zone Description (screen-only) */}
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="FIRM Panel" className="flex-1 min-w-36" autofilled={a('firm_panel')}>
          <input
            value={form.firm_panel}
            onChange={e => update({ firm_panel: e.target.value })}
            placeholder="Auto-filled"
            className={`${inputCls()} bg-gray-50`}
          />
        </Field>
        <Field label="FIRM Eff. Date" className="flex-1 min-w-36" autofilled={a('firm_eff_date')}>
          <input
            value={form.firm_eff_date}
            onChange={e => update({ firm_eff_date: e.target.value })}
            placeholder="Auto-filled"
            className={`${inputCls()} bg-gray-50`}
          />
        </Field>
        <Field label="Zone Description" className="flex-[2] min-w-48 print:hidden" autofilled={a('flood_zone_description')}>
          <input
            value={form.flood_zone_description}
            onChange={e => update({ flood_zone_description: e.target.value })}
            placeholder="Auto-filled (screen only)"
            className={`${inputCls()} bg-gray-50`}
          />
        </Field>
      </div>

      {/* Row 3: Dwelling Coverage, Contents Coverage */}
      <div className="flex gap-3.5 flex-wrap mb-4">
        <Field label="Dwelling Coverage" className="flex-1 min-w-36">
          <DollarInput value={form.flood_cov_dwelling} onChange={v => update({ flood_cov_dwelling: v })} />
        </Field>
        <Field label="Contents Coverage" className="flex-1 min-w-36">
          <DollarInput value={form.flood_cov_contents} onChange={v => update({ flood_cov_contents: v })} />
        </Field>
      </div>

      {/* Quoted Through / Premium */}
      <div className="border-t border-[#d0cdc8] pt-4">
        <div className="text-[11px] font-semibold text-navy uppercase tracking-[0.03em] mb-2">Quoted Through / Premium</div>
        <div className="space-y-2">
          {form.flood_quotes.map((q, idx) => (
            <div key={q.uid} className="flex gap-2.5 items-end flex-wrap pb-2 border-b border-[#d0cdc8] last:border-0 last:pb-0">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center self-end mb-1">
                {idx + 1}
              </span>
              <Field label="Carrier" className="flex-[3] min-w-48">
                <input value={q.carrier} onChange={e => updateFloodQuote(q.uid, { carrier: e.target.value })} className={inputCls()} />
              </Field>
              <Field label="Annual Premium" className="flex-[2] min-w-36">
                <DollarInput value={q.premium} onChange={v => updateFloodQuote(q.uid, { premium: v })} />
              </Field>
              {idx > 0 && (
                <button
                  onClick={() => removeFloodQuote(q.uid)}
                  className="border border-[#e0a0a0] text-[#c0504d] text-[11px] font-bold px-2.5 py-0.5 rounded hover:bg-[#fdf0f0] transition-colors self-end mb-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addFloodQuote}
          className="mt-3.5 text-[13px] font-bold text-navy border border-dashed border-navy rounded px-4 py-2 hover:bg-[#f0ede8] transition-colors inline-flex items-center gap-1.5"
        >
          + Add Quote
        </button>
      </div>
    </SectionCard>
  )
}
