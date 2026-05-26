'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { YesNo } from '../ui/RadioGroup'
import { DollarInput } from '../ui/DollarInput'
import { formatDate } from '@/lib/formatters'

const AGENTS = ['Becca','GA/Danny','Jennie','Mallory','Rob','Sam']

export function Section1() {
  const { form, update, autofilledFields } = useQuoteForm()
  const a = (key: string) => autofilledFields.has(key)

  return (
    <SectionCard number={1} title="File & Referral Info">
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Agent" className="w-40">
          <select value={form.agent} onChange={e => update({ agent: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {AGENTS.map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Referred By" className="flex-1 min-w-36" autofilled={a('referred_by_name')}>
          <input value={form.referred_by_name} onChange={e => update({ referred_by_name: e.target.value })} placeholder="Name" className={inputCls(a('referred_by_name'))} />
        </Field>
        <Field label="Company" className="flex-1 min-w-36" autofilled={a('referred_by_company')}>
          <input value={form.referred_by_company} onChange={e => update({ referred_by_company: e.target.value })} placeholder="Company" className={inputCls(a('referred_by_company'))} />
        </Field>
        <Field label="New Purchase?" autofilled={a('new_purchase')} badgeOutside>
          <YesNo name="new_purchase" value={form.new_purchase} onChange={v => update({ new_purchase: v })} />
        </Field>
      </div>

      {form.new_purchase === 'yes' && (
        <div className="flex gap-3.5 flex-wrap mb-3 bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
          <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] w-full mb-1">Purchase Details</div>
          <Field label="Closing Date" className="w-32" autofilled={a('closing_date')}>
            <input
              value={form.closing_date}
              onChange={e => update({ closing_date: formatDate(e.target.value) })}
              placeholder="MM/DD/YYYY"
              maxLength={10}
              className={inputCls(a('closing_date'))}
            />
          </Field>
          <Field label="Sales Price" className="flex-1 min-w-36" autofilled={a('sales_price')} badgeOutside>
            <DollarInput value={form.sales_price} onChange={v => update({ sales_price: v })} />
          </Field>
          <Field label="Contact (Attorney or Lender)" className="flex-[2] min-w-48">
            <input value={form.closing_contact} onChange={e => update({ closing_contact: e.target.value })} className={inputCls()} />
          </Field>
        </div>
      )}

      {form.new_purchase === 'no' && (
        <div className="flex gap-3.5 flex-wrap mb-3 bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
          <Field label="Purchase Year" className="w-28">
            <input value={form.purchase_year} onChange={e => update({ purchase_year: e.target.value })} placeholder="YYYY" className={inputCls()} />
          </Field>
          <Field label="Current Carrier" className="flex-1 min-w-36">
            <input value={form.current_carrier} onChange={e => update({ current_carrier: e.target.value })} className={inputCls()} />
          </Field>
          <Field label="Premium" className="flex-1 min-w-28">
            <DollarInput value={form.premium} onChange={v => update({ premium: v })} />
          </Field>
        </div>
      )}

      {!form.mortgagee_open ? (
        <button
          type="button"
          onClick={() => update({ mortgagee_open: true })}
          className="text-sm font-semibold text-navy hover:text-gold transition-colors flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> Add Mortgagee Clause
        </button>
      ) : (
        <div className="bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em]">Mortgagee Clause</div>
            <button
              type="button"
              onClick={() => update({ mortgagee_open: false })}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              − hide
            </button>
          </div>
          <div className="flex gap-3.5 flex-wrap mb-2">
            <Field label="Mortgagee Name" className="flex-[3] min-w-60" autofilled={a('mortgagee_name')}>
              <input value={form.mortgagee_name} onChange={e => update({ mortgagee_name: e.target.value })} placeholder="e.g. First National Bank ISAOA/ATIMA" className={inputCls(a('mortgagee_name'))} />
            </Field>
          </div>
          <div className="flex gap-3.5 flex-wrap mb-2">
            <Field label="Street Address" className="flex-[3] min-w-48" autofilled={a('mortgagee_street')}>
              <input value={form.mortgagee_street} onChange={e => update({ mortgagee_street: e.target.value })} className={inputCls(a('mortgagee_street'))} />
            </Field>
            <Field label="City" className="flex-[2] min-w-36" autofilled={a('mortgagee_city')}>
              <input value={form.mortgagee_city} onChange={e => update({ mortgagee_city: e.target.value })} className={inputCls(a('mortgagee_city'))} />
            </Field>
            <Field label="State" className="w-20" autofilled={a('mortgagee_state')} badgeRight="right-7">
              <StateSelect value={form.mortgagee_state} onChange={v => update({ mortgagee_state: v })} autofilled={a('mortgagee_state')} />
            </Field>
            <Field label="ZIP" className="w-24" autofilled={a('mortgagee_zip')}>
              <input value={form.mortgagee_zip} onChange={e => update({ mortgagee_zip: e.target.value })} maxLength={10} className={inputCls(a('mortgagee_zip'))} />
            </Field>
          </div>
          <div className="flex gap-3.5 flex-wrap">
            <Field label="Loan Number" className="w-52" autofilled={a('loan_number')}>
              <input value={form.loan_number} onChange={e => update({ loan_number: e.target.value })} className={inputCls(a('loan_number'))} />
            </Field>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
