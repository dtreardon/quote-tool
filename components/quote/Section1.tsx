'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { YesNo } from '../ui/RadioGroup'
import { DollarInput } from '../ui/DollarInput'
import { formatDate } from '@/lib/formatters'

const AGENTS = ['Becca','Emily','GA/Danny','Jennie','Mallory','Rob','Sam']

export function Section1() {
  const { form, update, flashFields } = useQuoteForm()
  const f = (key: string) => flashFields.has(key)

  return (
    <SectionCard number={1} title="File & Referral Info">
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Agent" className="w-40">
          <select value={form.agent} onChange={e => update({ agent: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {AGENTS.map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Referred By" className="flex-1 min-w-36">
          <input value={form.referred_by_name} onChange={e => update({ referred_by_name: e.target.value })} placeholder="Name" className={inputCls(f('referred_by_name'))} />
        </Field>
        <Field label="Company" className="flex-1 min-w-36">
          <input value={form.referred_by_company} onChange={e => update({ referred_by_company: e.target.value })} placeholder="Company" className={inputCls(f('referred_by_company'))} />
        </Field>
        <Field label="New Purchase?">
          <YesNo name="new_purchase" value={form.new_purchase} onChange={v => update({ new_purchase: v })} />
        </Field>
      </div>

      {form.new_purchase === 'yes' && (
        <div className="flex gap-3.5 flex-wrap mb-3 bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
          <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] w-full mb-1">Purchase Details</div>
          <Field label="Closing Date" className="w-32">
            <input
              value={form.closing_date}
              onChange={e => update({ closing_date: formatDate(e.target.value) })}
              placeholder="MM/DD/YYYY"
              maxLength={10}
              className={inputCls(f('closing_date'))}
            />
          </Field>
          <Field label="Sales Price" className="flex-1 min-w-36">
            <DollarInput value={form.sales_price} onChange={v => update({ sales_price: v })} flash={f('sales_price')} />
          </Field>
          <Field label="Contact (Attorney or Lender)" className="flex-[2] min-w-48">
            <input value={form.closing_contact} onChange={e => update({ closing_contact: e.target.value })} className={inputCls(f('closing_contact'))} />
          </Field>
        </div>
      )}

      {form.new_purchase === 'no' && (
        <div className="flex gap-3.5 flex-wrap mb-3 bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
          <Field label="Purchase Year" className="w-28">
            <input value={form.purchase_year} onChange={e => update({ purchase_year: e.target.value })} placeholder="YYYY" className={inputCls()} />
          </Field>
          <Field label="Current Carrier" className="flex-1 min-w-36">
            <input value={form.current_carrier} onChange={e => update({ current_carrier: e.target.value })} className={inputCls(f('current_carrier'))} />
          </Field>
          <Field label="Premium" className="flex-1 min-w-28">
            <DollarInput value={form.premium} onChange={v => update({ premium: v })} flash={f('premium')} />
          </Field>
        </div>
      )}

      <div className="mb-1 text-[11px] font-bold text-[#666] uppercase tracking-[0.05em]">Mortgagee Clause</div>
      <div className="flex gap-3.5 flex-wrap mb-2">
        <Field label="Mortgagee Name" className="flex-[3] min-w-60">
          <input value={form.mortgagee_name} onChange={e => update({ mortgagee_name: e.target.value })} placeholder="e.g. First National Bank ISAOA/ATIMA" className={inputCls(f('mortgagee_name'))} />
        </Field>
      </div>
      <div className="flex gap-3.5 flex-wrap mb-2">
        <Field label="Street Address" className="flex-[3] min-w-48">
          <input value={form.mortgagee_street} onChange={e => update({ mortgagee_street: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="City" className="flex-[2] min-w-36">
          <input value={form.mortgagee_city} onChange={e => update({ mortgagee_city: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="State" className="w-20">
          <StateSelect value={form.mortgagee_state} onChange={v => update({ mortgagee_state: v })} />
        </Field>
        <Field label="ZIP" className="w-24">
          <input value={form.mortgagee_zip} onChange={e => update({ mortgagee_zip: e.target.value })} maxLength={10} className={inputCls()} />
        </Field>
      </div>
      <div className="flex gap-3.5 flex-wrap">
        <Field label="Loan Number" className="w-52">
          <input value={form.loan_number} onChange={e => update({ loan_number: e.target.value })} className={inputCls(f('loan_number'))} />
        </Field>
      </div>
    </SectionCard>
  )
}
