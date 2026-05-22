'use client'

import { useQuoteForm } from './QuoteFormContext'
import { selectCls } from '../ui/Field'

export function Banner() {
  const { form, update } = useQuoteForm()
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
        <select
          value={form.occupancy}
          onChange={e => update({ occupancy: e.target.value })}
          className="rounded border border-white/30 bg-white/15 text-white pl-2.5 pr-7 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold w-44 [&>option]:bg-navy [&>option]:text-white"
        >
          <option value="">Select…</option>
          {['Primary','Secondary','Rental – Long-term','Rental – Short-term'].map(o => <option key={o}>{o}</option>)}
        </select>
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
        <div className="flex gap-4 mt-1">
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
        </div>
      </div>
    </div>
  )
}
