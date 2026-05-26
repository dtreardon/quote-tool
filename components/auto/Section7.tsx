'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { DollarInput } from '../ui/DollarInput'
import type { QuoteData } from '@/app/types/autoForm'

let nextQuoteUid = 2

function blankQuote(): QuoteData {
  return { uid: nextQuoteUid++, carrier: '', premium: '' }
}

export function Section7() {
  const { form, update } = useAutoForm()

  function addQuote() {
    update({ quotes: [...form.quotes, blankQuote()] })
  }

  function removeQuote(uid: number) {
    update({ quotes: form.quotes.filter(q => q.uid !== uid) })
  }

  function updateQuote(uid: number, patch: Partial<QuoteData>) {
    update({ quotes: form.quotes.map(q => q.uid === uid ? { ...q, ...patch } : q) })
  }

  return (
    <SectionCard number={7} title="Quoted Through / Premium">
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
                className={inputCls()}
              />
            </Field>
            <Field label="Annual Premium" className="flex-[2] min-w-36">
              <DollarInput value={q.premium} onChange={v => updateQuote(q.uid, { premium: v })} />
            </Field>
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
