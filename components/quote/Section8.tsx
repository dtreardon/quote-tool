'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'

export function Section8() {
  const { form, update, autofilledFields } = useQuoteForm()
  const a = (key: string) => autofilledFields.has(key)

  return (
    <SectionCard number={8} title="Location & Rating Info">
      <div className="flex gap-3.5 flex-wrap">
        <Field label="Protection Class" className="w-36">
          <input value={form.protection_class} onChange={e => update({ protection_class: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Territory Code" className="w-36">
          <input value={form.territory_code} onChange={e => update({ territory_code: e.target.value })} className={inputCls()} />
        </Field>

        <Field label="Miles to Fire Dept" className="flex-1 min-w-44">
          <label className="flex items-center gap-1.5 text-[13px] cursor-pointer mb-1">
            <input
              type="checkbox"
              checked={form.fire_dept_over}
              onChange={e => update({ fire_dept_over: e.target.checked })}
              className="accent-navy w-[15px] h-[15px]"
            />
            More than 5 miles
          </label>
          {form.fire_dept_over && (
            <input
              value={form.miles_fire_dept}
              onChange={e => update({ miles_fire_dept: e.target.value })}
              placeholder="Enter miles"
              className={inputCls()}
            />
          )}
        </Field>

        <Field label="Feet to Fire Hydrant" className="flex-1 min-w-44">
          <label className="flex items-center gap-1.5 text-[13px] cursor-pointer mb-1">
            <input
              type="checkbox"
              checked={form.hydrant_over}
              onChange={e => update({ hydrant_over: e.target.checked })}
              className="accent-navy w-[15px] h-[15px]"
            />
            More than 1000 ft
          </label>
          {form.hydrant_over && (
            <input
              value={form.feet_hydrant}
              onChange={e => update({ feet_hydrant: e.target.value })}
              placeholder="Enter feet"
              className={inputCls()}
            />
          )}
        </Field>

        <Field label="Miles to Coast" className="w-36" autofilled={a('miles_coast')}>
          <input
            value={form.miles_coast}
            onChange={e => update({ miles_coast: e.target.value })}
            placeholder="Auto-filled"
            className={`${inputCls()} bg-gray-50`}
          />
        </Field>

        <Field label="Barrier Island?" className="w-36">
          <label className="flex items-center gap-1.5 text-[13px] cursor-pointer mt-[7px]">
            <input
              type="checkbox"
              checked={form.barrier_island}
              onChange={e => update({ barrier_island: e.target.checked })}
              className="accent-navy w-[15px] h-[15px]"
            />
            Yes
          </label>
        </Field>
      </div>
    </SectionCard>
  )
}
