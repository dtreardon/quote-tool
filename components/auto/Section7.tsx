'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'

export function Section7() {
  const { form, update } = useAutoForm()

  return (
    <SectionCard number={7} title="Underwriting Questions">
      <div className="flex gap-5 flex-wrap">
        <Field label="Any DUI / DWI in past 5 years?" badgeOutside>
          <YesNo name="auto_has_dui" value={form.has_dui} onChange={v => update({ has_dui: v })} />
        </Field>

        <Field label="Any moving violations in past 3 years?" badgeOutside>
          <YesNo name="auto_has_violations" value={form.has_violations} onChange={v => update({ has_violations: v })} />
        </Field>
        {form.has_violations === 'yes' && (
          <Field label="Number of Violations" className="w-24">
            <input
              type="number"
              min="1"
              value={form.num_violations}
              onChange={e => update({ num_violations: e.target.value })}
              className={inputCls()}
            />
          </Field>
        )}

        <Field label="Any at-fault accidents in past 3 years?" badgeOutside>
          <YesNo name="auto_has_accidents" value={form.has_accidents} onChange={v => update({ has_accidents: v })} />
        </Field>
        {form.has_accidents === 'yes' && (
          <Field label="Number of Accidents" className="w-24">
            <input
              type="number"
              min="1"
              value={form.num_accidents}
              onChange={e => update({ num_accidents: e.target.value })}
              className={inputCls()}
            />
          </Field>
        )}

        <Field label="Bankruptcy in past 7 years?" badgeOutside>
          <YesNo name="auto_bankruptcy" value={form.bankruptcy} onChange={v => update({ bankruptcy: v })} />
        </Field>
      </div>
    </SectionCard>
  )
}
