'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'
import { DollarInput } from '../ui/DollarInput'

export function Section10() {
  const { form, update } = useQuoteForm()

  return (
    <SectionCard number={10} title="Flood Information">
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Flood Zone" className="w-32">
          <input value={form.flood_zone} onChange={e => update({ flood_zone: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Lot Height" className="w-32">
          <input value={form.lot_height} onChange={e => update({ lot_height: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Elevation Certificate?">
          <YesNo name="elevation_cert" value={form.elevation_cert} onChange={v => update({ elevation_cert: v })} />
        </Field>
        <Field label="Flood Type" className="flex-1 min-w-40">
          <select value={form.flood_type} onChange={e => update({ flood_type: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            <option>Loan Closing</option>
            <option>Standard Wait</option>
            <option>Rewrite</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-3.5 flex-wrap">
        <Field label="Dwelling Coverage" className="flex-1 min-w-36">
          <DollarInput value={form.flood_cov_dwelling} onChange={v => update({ flood_cov_dwelling: v })} />
        </Field>
        <Field label="Contents Coverage" className="flex-1 min-w-36">
          <DollarInput value={form.flood_cov_contents} onChange={v => update({ flood_cov_contents: v })} />
        </Field>
      </div>
    </SectionCard>
  )
}
