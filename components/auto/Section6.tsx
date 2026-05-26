'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'

const BI_PD_OPTIONS = [
  '', '10/20', '25/50', '50/100', '100/300', '250/500', '500/500',
]
const UM_OPTIONS = [
  '', '10/20', '25/50', '50/100', '100/300', '250/500',
]
const MED_OPTIONS = [
  '', '1,000', '2,000', '5,000', '10,000', '25,000',
]

export function Section6() {
  const { form, update } = useAutoForm()

  return (
    <SectionCard number={6} title="Coverage">
      {/* BI/PD + UM/UIM */}
      <div className="flex gap-3.5 flex-wrap mb-4 bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
        <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] w-full mb-1">Liability & UM/UIM</div>
        <Field label="Bodily Injury / Property Damage" className="flex-1 min-w-44">
          <select value={form.cov_bi} onChange={e => update({ cov_bi: e.target.value })} className={selectCls()}>
            {BI_PD_OPTIONS.map(o => <option key={o} value={o}>{o || 'Select limits…'}</option>)}
          </select>
        </Field>
        <Field label="Prop Damage Limit" className="flex-1 min-w-36">
          <input
            value={form.cov_pd}
            onChange={e => update({ cov_pd: e.target.value })}
            placeholder="e.g. 100,000"
            className={inputCls()}
          />
        </Field>
        <Field label="UM / UIM Limits" className="flex-1 min-w-44">
          <select value={form.cov_um} onChange={e => update({ cov_um: e.target.value })} className={selectCls()}>
            {UM_OPTIONS.map(o => <option key={o} value={o}>{o || 'Select limits…'}</option>)}
          </select>
        </Field>
        <Field label="UIM Separate?" className="flex-shrink-0" badgeOutside>
          <YesNo name="uim_separate" value={form.cov_uim} onChange={v => update({ cov_uim: v })} />
        </Field>
      </div>

      {/* Med Pay / PIP */}
      <div className="flex gap-3.5 flex-wrap mb-4 bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5">
        <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] w-full mb-1">Medical Payments / PIP</div>
        <Field label="Med Pay Limit" className="flex-1 min-w-36">
          <select value={form.cov_med} onChange={e => update({ cov_med: e.target.value })} className={selectCls()}>
            {MED_OPTIONS.map(o => <option key={o} value={o}>{o || 'Select…'}</option>)}
          </select>
        </Field>
        <Field label="PIP Limit" className="flex-1 min-w-36">
          <input value={form.cov_pip} onChange={e => update({ cov_pip: e.target.value })} placeholder="Amount or N/A" className={inputCls()} />
        </Field>
      </div>

      {/* Extras */}
      <div className="flex gap-5 flex-wrap">
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
