'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { YesNo } from '../ui/RadioGroup'
import { formatPhone, formatSSN, formatDate } from '@/lib/formatters'
import type { DriverData } from '@/app/types/autoForm'

let nextDriverUid = 2

function blankDriver(): DriverData {
  return {
    uid: nextDriverUid++,
    secondary_named_insured: false,
    first: '', middle: '', last: '', suffix: '',
    dob: '', ssn: '', marital: '', occupation: '',
    phone: '', email: '',
    license_number: '', license_state: '', sr22: '',
  }
}

export function Section2() {
  const { form, update } = useAutoForm()

  function addDriver() {
    update({ drivers: [...form.drivers, blankDriver()] })
  }

  function removeDriver(uid: number) {
    update({ drivers: form.drivers.filter(d => d.uid !== uid) })
  }

  function updateDriver(uid: number, patch: Partial<DriverData>) {
    update({ drivers: form.drivers.map(d => d.uid === uid ? { ...d, ...patch } : d) })
  }

  return (
    <SectionCard number={2} title="Drivers">
      <div className="space-y-3.5">
        {form.drivers.map((drv, idx) => {
          const isPrimary = idx === 0
          const u = (patch: Partial<DriverData>) => updateDriver(drv.uid, patch)

          return (
            <div key={drv.uid} className="border border-[#d0cdc8] rounded p-4 bg-[#fdfcfa]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-navy uppercase tracking-[0.05em]">
                  {isPrimary ? 'Driver 1 — Primary Named Insured' : `Driver ${idx + 1}`}
                </span>
                {!isPrimary && (
                  <button
                    onClick={() => removeDriver(drv.uid)}
                    className="border border-[#e0a0a0] text-[#c0504d] text-[11px] font-bold px-2.5 py-0.5 rounded hover:bg-[#fdf0f0] transition-colors"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Secondary Named Insured checkbox (non-primary only) */}
              {!isPrimary && (
                <div className="mb-3">
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-navy cursor-pointer">
                    <input
                      type="checkbox"
                      checked={drv.secondary_named_insured}
                      onChange={e => u({ secondary_named_insured: e.target.checked })}
                      className="w-4 h-4 accent-navy"
                    />
                    Secondary Named Insured?
                  </label>
                </div>
              )}

              {/* Row 1: Name */}
              <div className="flex gap-3.5 flex-wrap mb-3">
                <Field label="First Name" className="flex-[2] min-w-28">
                  <input value={drv.first} onChange={e => u({ first: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="Middle Name" className="flex-[2] min-w-24">
                  <input value={drv.middle} onChange={e => u({ middle: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="Last Name" className="flex-[3] min-w-32">
                  <input value={drv.last} onChange={e => u({ last: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="Suffix" className="w-20" badgeRight="right-7">
                  <select value={drv.suffix} onChange={e => u({ suffix: e.target.value })} className={selectCls()}>
                    <option value=""></option>
                    {['Jr','Sr','II','III','IV'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              {/* Row 2: DOB, SSN, Marital, Occupation */}
              <div className="flex gap-3.5 flex-wrap mb-3">
                <Field label="Date of Birth" className="w-32">
                  <input
                    value={drv.dob}
                    onChange={e => u({ dob: formatDate(e.target.value) })}
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
                    className={inputCls()}
                  />
                </Field>
                <Field label="SSN (Last 4)" className="w-28">
                  <input
                    value={drv.ssn}
                    onChange={e => u({ ssn: formatSSN(e.target.value) })}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className={inputCls()}
                  />
                </Field>
                <Field label="Marital Status" className="flex-1 min-w-32" badgeRight="right-7">
                  <select value={drv.marital} onChange={e => u({ marital: e.target.value })} className={selectCls()}>
                    <option value="">Select…</option>
                    {['Married','Single','Divorced','Widowed'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Occupation" className="flex-[2] min-w-36">
                  <input value={drv.occupation} onChange={e => u({ occupation: e.target.value })} className={inputCls()} />
                </Field>
              </div>

              {/* Row 3: Phone, Email */}
              <div className="flex gap-3.5 flex-wrap mb-3">
                <Field label="Phone" className="w-44">
                  <input
                    value={drv.phone}
                    onChange={e => u({ phone: formatPhone(e.target.value) })}
                    placeholder="(XXX) XXX-XXXX"
                    maxLength={14}
                    className={inputCls()}
                  />
                </Field>
                <Field label="Email" className="flex-[2] min-w-48">
                  <input type="email" value={drv.email} onChange={e => u({ email: e.target.value })} className={inputCls()} />
                </Field>
              </div>

              {/* Row 4: License + SR-22 */}
              <div className="flex gap-3.5 flex-wrap">
                <Field label="Driver's License #" className="flex-[2] min-w-36">
                  <input value={drv.license_number} onChange={e => u({ license_number: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="License State" className="w-24" badgeRight="right-7">
                  <StateSelect value={drv.license_state} onChange={v => u({ license_state: v })} />
                </Field>
                <Field label="SR-22 Required?" badgeOutside>
                  <YesNo name={`sr22_${drv.uid}`} value={drv.sr22} onChange={v => u({ sr22: v })} />
                </Field>
              </div>
            </div>
          )
        })}
      </div>
      <button
        onClick={addDriver}
        className="mt-3.5 text-[13px] font-bold text-navy border border-dashed border-navy rounded px-4 py-2 hover:bg-[#f0ede8] transition-colors inline-flex items-center gap-1.5"
      >
        + Add Driver
      </button>
    </SectionCard>
  )
}
