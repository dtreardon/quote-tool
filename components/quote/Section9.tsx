'use client'

import { useState } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { DollarInput } from '../ui/DollarInput'
import type { QuoteData } from '@/app/types/form'
import { runEligibility, type EligibleCarrier, type IneligibleCarrier } from '@/lib/carrierEngine'

let nextQuoteUid = 2

function blankQuote(): QuoteData {
  return { uid: nextQuoteUid++, carrier: '', premium: '' }
}

function scoreBadgeStyle(score: number): React.CSSProperties {
  const color = score >= 9 ? '#16a34a' : score >= 7 ? '#c8922a' : '#6b7280'
  return { color, background: color + '18', border: `1px solid ${color}55` }
}

export function Section9() {
  const { form, update } = useQuoteForm()

  const [eligible, setEligible]       = useState<EligibleCarrier[]>([])
  const [ineligible, setIneligible]   = useState<IneligibleCarrier[]>([])
  const [hasRun, setHasRun]                   = useState(false)
  const [showAll, setShowAll]                 = useState(false)
  const [showIneligible, setShowIneligible]   = useState(false)
  const [quoteScores, setQuoteScores]         = useState<Map<number, number>>(new Map())
  const [flashedUids, setFlashedUids] = useState<Set<number>>(new Set())

  const missing: string[] = []
  if (!form.prop_state)  missing.push('State')
  if (!form.year_built)  missing.push('Year Built')
  if (!form.reno_roof)   missing.push('Roof Year')
  if (!form.policy_type) missing.push('Policy Type')
  const canCheck = missing.length === 0

  function handleCheck() {
    const result = runEligibility({
      state:           form.prop_state,
      zip:             form.prop_zip,
      county:          form.prop_county,
      distanceToCoast: form.miles_coast ? parseFloat(form.miles_coast) : null,
      buildYear:       form.year_built  ? parseInt(form.year_built, 10)  : null,
      roofYear:        form.reno_roof   ? parseInt(form.reno_roof, 10)   : null,
      roofType:        form.roof_type,
      policyType:      form.policy_type,
      mobileHome:      form.policy_type === 'MH',
      barrierIsland:   form.barrier_island,
      dwellingCov:     form.cov_dwelling ? parseFloat(form.cov_dwelling.replace(/,/g, '')) : null,
    })
    setEligible(result.eligible)
    setIneligible(result.ineligible)
    setHasRun(true)
    setShowAll(false)
    populateRows(result.eligible.slice(0, 3))
  }

  function populateRows(carriers: EligibleCarrier[]) {
    const newQuotes: QuoteData[] = carriers.map((c, idx) => ({
      uid:     form.quotes[idx]?.uid ?? nextQuoteUid++,
      carrier: c.label,
      premium: form.quotes[idx]?.premium ?? '',
    }))
    if (newQuotes.length === 0) newQuotes.push({ uid: nextQuoteUid++, carrier: '', premium: '' })

    const scoreMap = new Map<number, number>()
    newQuotes.forEach((q, idx) => { if (carriers[idx]) scoreMap.set(q.uid, carriers[idx].score) })
    setQuoteScores(scoreMap)

    setFlashedUids(new Set(newQuotes.map(q => q.uid)))
    setTimeout(() => setFlashedUids(new Set()), 2500)

    update({ quotes: newQuotes })
  }

  function addQuote() {
    update({ quotes: [...form.quotes, blankQuote()] })
  }

  function removeQuote(uid: number) {
    update({ quotes: form.quotes.filter(q => q.uid !== uid) })
    setQuoteScores(prev => { const m = new Map(prev); m.delete(uid); return m })
  }

  function updateQuote(uid: number, patch: Partial<QuoteData>) {
    update({ quotes: form.quotes.map(q => q.uid === uid ? { ...q, ...patch } : q) })
  }

  const displayEligible     = showAll ? eligible : eligible.slice(0, 3)
  const visibleIneligible   = ineligible.filter(c => c.reason !== 'State not eligible')
  const brokersFallback     = eligible.length < 3 && !eligible.some(c => c.key === 'brokers')

  return (
    <SectionCard number={9} title="Quoted Through / Premium">

      {/* ── Check Eligibility button ── */}
      <div className="mb-4 flex items-center gap-3 flex-wrap print:hidden">
        <span title={!canCheck ? `Missing: ${missing.join(', ')}` : undefined}>
          <button
            onClick={handleCheck}
            disabled={!canCheck}
            className="bg-navy hover:bg-[#253d6b] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded text-sm transition-colors"
          >
            Check Eligibility
          </button>
        </span>
        {!canCheck && (
          <span className="text-[12px] text-gray-400 italic">
            Needs: {missing.join(', ')}
          </span>
        )}
      </div>

      {/* ── Results panel ── */}
      {hasRun && (
        <div className="mb-5 rounded-lg border border-[#d0cdc8] overflow-hidden print:hidden">

          {/* Eligible header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#f0ede8] border-b border-[#d0cdc8]">
            <span className="text-[11px] font-bold text-navy uppercase tracking-[0.05em]">
              Eligible ({eligible.length})
            </span>
            <button
              onClick={() => setShowAll(v => !v)}
              className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                !showAll
                  ? 'bg-navy text-white'
                  : 'text-navy border border-navy hover:bg-[#f0ede8]'
              }`}
            >
              Top 3 Only
            </button>
          </div>

          {eligible.length === 0 ? (
            <div className="px-4 py-3 text-[12px] text-gray-400 italic">
              No carriers eligible with current inputs.
            </div>
          ) : (
            displayEligible.map(c => (
              <div key={c.key} className="flex items-start gap-3 px-4 py-2.5 border-b border-[#ede9e3] last:border-0 bg-white hover:bg-[#faf9f7] transition-colors">
                <span
                  className="flex-shrink-0 mt-0.5 text-[11px] font-bold rounded px-1.5 py-0.5"
                  style={{ ...scoreBadgeStyle(c.score), minWidth: 36, textAlign: 'center' }}
                >
                  {c.score}/10
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-navy leading-tight">{c.label}</div>
                  <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{c.reason}</div>
                  {c.alerts.map((a, i) => (
                    <div key={i} className="text-[11px] text-amber-600 font-semibold mt-0.5">⚠ {a}</div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Brokers fallback */}
          {brokersFallback && (
            <div className="flex items-start gap-3 px-4 py-2.5 border-b border-[#ede9e3] bg-white">
              <span
                className="flex-shrink-0 mt-0.5 text-[11px] font-bold rounded px-1.5 py-0.5 bg-gray-100 text-gray-400 border border-gray-200"
                style={{ minWidth: 36, textAlign: 'center' }}
              >
                —
              </span>
              <div>
                <div className="text-[13px] font-bold text-navy leading-tight">Brokers</div>
                <div className="text-[11px] text-gray-500 leading-snug mt-0.5 italic">Quote for price</div>
              </div>
            </div>
          )}

          {/* Ineligible (collapsible, state-only carriers hidden) */}
          {visibleIneligible.length > 0 && (
            <>
              <button
                onClick={() => setShowIneligible(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 bg-[#f8f7f5] border-t border-[#d0cdc8] hover:bg-[#f0ede8] transition-colors"
              >
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.05em]">
                  {showIneligible ? `Hide Ineligible ▲` : `Show Ineligible (${visibleIneligible.length}) ▾`}
                </span>
              </button>
              {showIneligible && visibleIneligible.map(c => (
                <div key={c.key} className="flex items-center gap-3 px-4 py-1.5 border-b border-[#ede9e3] last:border-0">
                  <span
                    className="flex-shrink-0 text-[11px] font-bold rounded px-1.5 py-0.5 bg-gray-100 text-gray-400 border border-gray-200"
                    style={{ minWidth: 36, textAlign: 'center' }}
                  >
                    —
                  </span>
                  <span className="text-[12px] font-semibold text-gray-400 w-40 flex-shrink-0">{c.label}</span>
                  <span className="text-[11px] text-gray-400 leading-snug">{c.reason}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Quote rows (editable, print-visible) ── */}
      <div className="space-y-2">
        {form.quotes.map((q, idx) => (
          <div key={q.uid} className="flex gap-2.5 items-end flex-wrap pb-2 border-b border-[#d0cdc8] last:border-0 last:pb-0">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center self-end mb-1">
              {idx + 1}
            </span>
            <Field label="Carrier" className="flex-[3] min-w-48">
              <input
                value={q.carrier}
                onChange={e => updateQuote(q.uid, { carrier: e.target.value })}
                className={inputCls(flashedUids.has(q.uid))}
              />
            </Field>
            <Field label="Annual Premium" className="flex-[2] min-w-36">
              <DollarInput value={q.premium} onChange={v => updateQuote(q.uid, { premium: v })} />
            </Field>
            {quoteScores.has(q.uid) && (
              <span
                className="flex-shrink-0 self-end mb-[5px] text-[11px] font-bold rounded px-1.5 py-[4px] print:hidden"
                style={{ ...scoreBadgeStyle(quoteScores.get(q.uid)!), minWidth: 36, textAlign: 'center' }}
              >
                {quoteScores.get(q.uid)}/10
              </span>
            )}
            {idx > 0 && (
              <button
                onClick={() => removeQuote(q.uid)}
                className="border border-[#e0a0a0] text-[#c0504d] text-[11px] font-bold px-2.5 py-0.5 rounded hover:bg-[#fdf0f0] transition-colors self-end mb-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addQuote}
        className="mt-3.5 text-[13px] font-bold text-navy border border-dashed border-navy rounded px-4 py-2 hover:bg-[#f0ede8] transition-colors inline-flex items-center gap-1.5"
      >
        + Add Quote
      </button>
    </SectionCard>
  )
}
