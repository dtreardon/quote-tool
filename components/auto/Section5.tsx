'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { YesNo } from '../ui/RadioGroup'
import { formatDate } from '@/lib/formatters'
import type { DriverData } from '@/app/types/autoForm'

let nextDriverUid = 2

function blankDriver(): DriverData {
  return {
    uid: nextDriverUid++,
    first: '', last: '', dob: '', license_number: '',
    license_state: '', relationship: '', good_student: '', sr22: '',
  }
}

function calcAge(dob: string): number | null {
  if (!dob || dob.length < 10) return null
  const [m, d, y] = dob.split('/')
  if (!m || !d || !y || y.length < 4) return null
  const birth = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return isNaN(age) ? null : age
}

export function Section5() {
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
    <SectionCard number={5} title="Drivers">
      <div className="space-y-3.5">
        {form.drivers.map((drv, idx) => {
          const isPrimary = idx === 0
          const age = calcAge(drv.dob)
          const showGoodStudent = age !== null && age >= 16 && age <= 25
          const u = (patch: Partial<DriverData>) => updateDriver(drv.uid, patch)

          return (
            <div key={drv.uid} className="border border-[#d0cdc8] rounded p-4 bg-[#fdfcfa]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-navy uppercase tracking-[0.05em]">
                  {isPrimary ? 'Primary Driver' : `Driver ${idx + 1}`}
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

              {/* Row 1: Name + DOB */}
              <div className="flex gap-3.5 flex-wrap mb-3">
                <Field label="First Name" className="flex-[2] min-w-28">
                  <input value={drv.first} onChange={e => u({ first: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="Last Name" className="flex-[3] min-w-32">
                  <input value={drv.last} onChange={e => u({ last: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="Date of Birth" className="w-32">
                  <input
                    value={drv.dob}
                    onChange={e => u({ dob: formatDate(e.target.value) })}
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
                    className={inputCls()}
                  />
                </Field>
                {age !== null && (
                  <div className="flex flex-col gap-1 justify-end">
                    <span className="text-[11px] text-gray-400 pb-[9px]">Age: <strong className="text-navy">{age}</strong></span>
                  </div>
                )}
              </div>

              {/* Row 2: License */}
              <div className="flex gap-3.5 flex-wrap mb-3">
                <Field label="License Number" className="flex-[2] min-w-36">
                  <input value={drv.license_number} onChange={e => u({ license_number: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="License State" className="w-24" badgeRight="right-7">
                  <StateSelect value={drv.license_state} onChange={v => u({ license_state: v })} />
                </Field>
                {!isPrimary && (
                  <Field label="Relationship to Primary" className="flex-[2] min-w-36">
                    <input value={drv.relationship} onChange={e => u({ relationship: e.target.value })} className={inputCls()} />
                  </Field>
                )}
              </div>

              {/* Row 3: Good Student + SR-22 */}
              <div className="flex gap-5 flex-wrap">
                {showGoodStudent && (
                  <Field label="Good Student Discount?" badgeOutside>
                    <YesNo name={`good_student_${drv.uid}`} value={drv.good_student} onChange={v => u({ good_student: v })} />
                  </Field>
                )}
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
