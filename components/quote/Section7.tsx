'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'
import { DollarInput } from '../ui/DollarInput'
import { formatDate } from '@/lib/formatters'
import type { ClaimData } from '@/app/types/form'

let nextClaimUid = 1

function blankClaim(): ClaimData {
  return { uid: nextClaimUid++, date: '', type: '', amount: '', carrier: '', status: '' }
}

export function Section7() {
  const { form, update } = useQuoteForm()

  function handleClaims(v: string) {
    update({ has_claims: v })
    if (v === 'yes' && form.claims.length === 0) {
      update({ has_claims: v, claims: [blankClaim()] })
    } else {
      update({ has_claims: v })
    }
  }

  function addClaim() {
    update({ claims: [...form.claims, blankClaim()] })
  }

  function removeClaim(uid: number) {
    update({ claims: form.claims.filter(c => c.uid !== uid) })
  }

  function updateClaim(uid: number, patch: Partial<ClaimData>) {
    update({ claims: form.claims.map(c => c.uid === uid ? { ...c, ...patch } : c) })
  }

  return (
    <SectionCard number={7} title="Underwriting Questions">
      <div className="flex gap-3.5 flex-wrap mb-3.5">
        <Field label="Bankruptcy, Foreclosure, or Felony (last 5 years)?" className="flex-[3] min-w-64">
          <YesNo name="bankruptcy" value={form.bankruptcy} onChange={v => update({ bankruptcy: v })} />
        </Field>
        <Field label="Dogs?" className="flex-1 min-w-24">
          <YesNo name="has_dogs" value={form.has_dogs} onChange={v => update({ has_dogs: v })} />
        </Field>
        {form.has_dogs === 'yes' && (
          <>
            <Field label="# of Dogs" className="w-20">
              <input type="number" min={0} value={form.num_dogs} onChange={e => update({ num_dogs: e.target.value })} className={inputCls()} />
            </Field>
            <Field label="Biting Breed?" className="flex-1 min-w-24">
              <YesNo name="biting_dogs" value={form.biting_dogs} onChange={v => update({ biting_dogs: v })} />
            </Field>
          </>
        )}
      </div>

      <div className="flex gap-3.5 flex-wrap">
        <Field label="Any Claims?" className="flex-1 min-w-24">
          <YesNo name="has_claims" value={form.has_claims} onChange={handleClaims} />
        </Field>
      </div>

      {form.has_claims === 'yes' && (
        <div className="mt-3 space-y-2">
          {form.claims.map((c, idx) => (
            <div key={c.uid} className="flex gap-2 flex-wrap items-end border-b border-[#d0cdc8] pb-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center self-end mb-1">
                {idx + 1}
              </span>
              <Field label="Date" className="w-28">
                <input
                  value={c.date}
                  onChange={e => updateClaim(c.uid, { date: formatDate(e.target.value) })}
                  placeholder="MM/DD/YYYY"
                  maxLength={10}
                  className={inputCls()}
                />
              </Field>
              <Field label="Type" className="flex-[2] min-w-36">
                <input value={c.type} onChange={e => updateClaim(c.uid, { type: e.target.value })} placeholder="Wind, Water, Fire…" className={inputCls()} />
              </Field>
              <Field label="Amount" className="w-32">
                <DollarInput value={c.amount} onChange={v => updateClaim(c.uid, { amount: v })} />
              </Field>
              <Field label="Carrier" className="flex-[2] min-w-36">
                <input value={c.carrier} onChange={e => updateClaim(c.uid, { carrier: e.target.value })} className={inputCls()} />
              </Field>
              <Field label="Status" className="flex-1 min-w-28">
                <input value={c.status} onChange={e => updateClaim(c.uid, { status: e.target.value })} placeholder="Open / Closed" className={inputCls()} />
              </Field>
              <button
                onClick={() => removeClaim(c.uid)}
                className="border border-[#e0a0a0] text-[#c0504d] text-[11px] font-bold px-2.5 py-0.5 rounded hover:bg-[#fdf0f0] transition-colors self-end mb-1"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addClaim}
            className="text-[13px] font-bold text-navy border border-dashed border-navy rounded px-4 py-2 hover:bg-[#f0ede8] transition-colors inline-flex items-center gap-1.5"
          >
            + Add Claim
          </button>
        </div>
      )}
    </SectionCard>
  )
}
