'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, selectCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'

const BI_OPTIONS = [
  '', '25/50', '50/100', '100/300', '250/500', '500/500', '100 CSL', '300 CSL', '500 CSL',
]
const PD_OPTIONS = [
  '', '$25,000', '$50,000', '$100,000', '$300,000', '$500,000',
]
const PIP_MED_OPTIONS = [
  '', 'None', '$1,000', '$2,000', '$2,500', '$5,000', '$10,000',
]

const isCsl = (v: string) => v.endsWith('CSL')

export function Section5() {
  const { form, update } = useAutoForm()

  return (
    <SectionCard number={5} title="Coverage">
      {/* BI/PD + UM/UIM */}
      <div className="flex gap-3.5 flex-wrap mb-4 bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
        <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] w-full mb-1">Liability & UM/UIM</div>
        <Field label="Bodily Injury (BI)" className="flex-1 min-w-44">
          <select value={form.cov_bi} onChange={e => update({ cov_bi: e.target.value })} className={selectCls()}>
            {BI_OPTIONS.map(o => <option key={o} value={o}>{o || 'Select limits…'}</option>)}
          </select>
        </Field>
        {!isCsl(form.cov_bi) && (
          <Field label="Property Damage (PD)" className="flex-1 min-w-36">
            <select value={form.cov_pd} onChange={e => update({ cov_pd: e.target.value })} className={selectCls()}>
              {PD_OPTIONS.map(o => <option key={o} value={o}>{o || 'Select limit…'}</option>)}
            </select>
          </Field>
        )}
        <Field label="UM / UIM Limits" className="flex-1 min-w-44">
          <select value={form.cov_um} onChange={e => update({ cov_um: e.target.value })} className={selectCls()}>
            {BI_OPTIONS.map(o => <option key={o} value={o}>{o || 'Select limits…'}</option>)}
          </select>
        </Field>
        <Field label="UIM Separate?" className="flex-shrink-0" badgeOutside>
          <YesNo name="uim_separate" value={form.cov_uim} onChange={v => update({ cov_uim: v })} />
        </Field>
      </div>

      {/* PIP / Med Pay + Extras */}
      <div className="flex gap-5 flex-wrap items-end">
        <Field label="PIP / Med Pay" className="w-36">
          <select value={form.pip_med_pay} onChange={e => update({ pip_med_pay: e.target.value })} className={selectCls()}>
            {PIP_MED_OPTIONS.map(o => <option key={o} value={o}>{o || 'Select…'}</option>)}
          </select>
        </Field>
        <Field label="Rental Reimbursement?" badgeOutside>
          <YesNo name="rental_reimbursement" value={form.rental_reimbursement} onChange={v => update({ rental_reimbursement: v })} />
        </Field>
        <Field label="Roadside Assistance?" badgeOutside>
          <YesNo name="roadside" value={form.roadside} onChange={v => update({ roadside: v })} />
        </Field>
      </div>
    </SectionCard>
  )
}
