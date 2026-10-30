'use client'

import { useState } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { selectCls } from '../ui/Field'
import { AutofillBadge } from '../ui/AutofillBadge'
import { isSpecialFloodHazardArea } from '@/lib/addressEnrichment'

function FloodZoneWarning({ zone }: { zone: string }) {
  const [show, setShow] = useState(false)
  const message = `Flood Zone ${zone.trim().toUpperCase()} is a Special Flood Hazard Area. Lender will likely require flood coverage.`
  return (
    <span className="relative flex-shrink-0 print:hidden">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        onBlur={() => setShow(false)}
        aria-label={message}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-[0_0_0_2px_rgba(220,38,38,0.35)] hover:scale-110 transition-transform"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path d="M12 2.5 1.5 21h21L12 2.5z" fill="#dc2626" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="11" y="9" width="2" height="6.5" rx="1" fill="#fff" />
          <circle cx="12" cy="18" r="1.2" fill="#fff" />
        </svg>
      </button>
      {show && (
        <span
          role="tooltip"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white text-[#991b1b] text-[12px] font-semibold leading-snug rounded px-3 py-2 shadow-lg border border-red-200 z-50"
        >
          {message}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-white" />
        </span>
      )}
    </span>
  )
}

export function Banner() {
  const { form, update, autofilledFields } = useQuoteForm()
  return (
    <div className="bg-navy rounded-md mb-[18px] px-5 py-4 flex gap-5 flex-wrap items-end print:hidden" style={{ boxShadow: '0 2px 12px rgba(51,78,133,0.10)' }}>
      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-semibold text-white/70 uppercase tracking-[0.05em]">Policy Type</label>
        <select
          value={form.policy_type}
          onChange={e => update({ policy_type: e.target.value })}
          className="rounded border border-white/30 bg-white/15 text-white pl-2.5 pr-7 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold w-36 [&>option]:bg-navy [&>option]:text-white"
        >
          <option value="">Select…</option>
          {['HO','DP','Condo','Renters','MH','Mono Flood'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-semibold text-white/70 uppercase tracking-[0.05em]">Occupancy</label>
        <div className="flex items-center gap-1">
          <select
            value={form.occupancy}
            onChange={e => update({ occupancy: e.target.value })}
            className="rounded border border-white/30 bg-white/15 text-white pl-2.5 pr-7 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold w-44 [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="">Select…</option>
            {['Primary','Secondary','Rental – Long-term','Rental – Short-term'].map(o => <option key={o}>{o}</option>)}
          </select>
          {autofilledFields.has('occupancy') && <AutofillBadge className="text-white/50 hover:text-white" />}
        </div>
      </div>

      {form.occupancy === 'Rental – Short-term' && (
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-semibold text-white/70 uppercase tracking-[0.05em]">Rental Term</label>
          <select
            value={form.rental_term}
            onChange={e => update({ rental_term: e.target.value })}
            className="rounded border border-white/30 bg-white/15 text-white pl-2.5 pr-7 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold w-36 [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="">Select…</option>
            {['Nightly','Weekly','Monthly','Annual'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-semibold text-white/70 uppercase tracking-[0.05em]">Flood Quote?</label>
        <div className="flex items-center gap-4 mt-1">
          {['yes','no'].map(v => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-white text-base font-semibold">
              <input
                type="radio"
                name="flood_quote"
                value={v}
                checked={form.flood_quote === v}
                onChange={() => update({ flood_quote: v })}
                className="w-5 h-5"
              />
              {v === 'yes' ? 'Yes' : 'No'}
            </label>
          ))}
          {isSpecialFloodHazardArea(form.flood_zone) && <FloodZoneWarning zone={form.flood_zone} />}
        </div>
      </div>
    </div>
  )
}
