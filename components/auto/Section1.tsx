'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'
import { DollarInput } from '../ui/DollarInput'
import { formatDate } from '@/lib/formatters'

const AGENTS = ['Becca','GA/Danny','Jennie','Mallory','Rob','Sam']

export function Section1() {
  const { form, update, autofilledFields } = useAutoForm()
  const a = (key: string) => autofilledFields.has(key)

  return (
    <SectionCard number={1} title="File & Referral Info">
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Agent" className="w-40">
          <select value={form.agent} onChange={e => update({ agent: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {AGENTS.map(ag => <option key={ag}>{ag}</option>)}
          </select>
        </Field>
        <Field label="Referred By" className="flex-1 min-w-36" autofilled={a('referred_by_name')}>
          <input value={form.referred_by_name} onChange={e => update({ referred_by_name: e.target.value })} placeholder="Name" className={inputCls(a('referred_by_name'))} />
        </Field>
        <Field label="Company" className="flex-1 min-w-36" autofilled={a('referred_by_company')}>
          <input value={form.referred_by_company} onChange={e => update({ referred_by_company: e.target.value })} placeholder="Company" className={inputCls(a('referred_by_company'))} />
        </Field>
        <Field label="New Purchase?" autofilled={a('new_purchase')} badgeOutside>
          <YesNo name="auto_new_purchase" value={form.new_purchase} onChange={v => update({ new_purchase: v })} />
        </Field>
      </div>

      {form.new_purchase === 'yes' && (
        <div className="flex gap-3.5 flex-wrap bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
          <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] w-full mb-1">Purchase Details</div>
          <Field label="Purchase Date" className="w-32" autofilled={a('closing_date')}>
            <input
              value={form.closing_date}
              onChange={e => update({ closing_date: formatDate(e.target.value) })}
              placeholder="MM/DD/YYYY"
              maxLength={10}
              className={inputCls(a('closing_date'))}
            />
          </Field>
          <Field label="Purchase Price" className="flex-1 min-w-36" autofilled={a('sales_price')} badgeOutside>
            <DollarInput value={form.sales_price} onChange={v => update({ sales_price: v })} />
          </Field>
        </div>
      )}

      {form.new_purchase === 'no' && (
        <div className="flex gap-3.5 flex-wrap bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
          <Field label="Current Carrier" className="flex-1 min-w-36">
            <input value={form.current_carrier} onChange={e => update({ current_carrier: e.target.value })} className={inputCls()} />
          </Field>
          <Field label="Current Premium" className="flex-1 min-w-28">
            <DollarInput value={form.premium} onChange={v => update({ premium: v })} />
          </Field>
        </div>
      )}
    </SectionCard>
  )
}
