'use client'

import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { formatPhone, formatSSN, formatDate } from '@/lib/formatters'
import type { InsuredData } from '@/app/types/autoForm'

let nextUid = 2

function blankInsured(): InsuredData {
  return {
    uid: nextUid++,
    first: '', middle: '', last: '', suffix: '',
    dob: '', ssn: '', marital: '', occupation: '',
    relationship: '', phone: '', email: '',
    showContact: false,
  }
}

export function Section2() {
  const { form, update, autofilledFields, clearAutofilled } = useAutoForm()
  const a = (uid: number, field: string) => autofilledFields.has(`ins_${uid}_${field}`)

  function addInsured() {
    update({ insureds: [...form.insureds, blankInsured()] })
  }

  function removeInsured(uid: number) {
    update({ insureds: form.insureds.filter(i => i.uid !== uid) })
  }

  function updateInsured(uid: number, patch: Partial<InsuredData>) {
    update({
      insureds: form.insureds.map(i => i.uid === uid ? { ...i, ...patch } : i),
    })
    const patchKeys = Object.keys(patch) as (keyof InsuredData)[]
    clearAutofilled(patchKeys.map(f => `ins_${uid}_${f}`))
  }

  return (
    <SectionCard number={2} title="Named Insured(s)">
      <div className="space-y-3.5">
        {form.insureds.map((ins, idx) => {
          const isPrimary = idx === 0
          const title = isPrimary ? 'Primary Named Insured' : `Additional Named Insured ${idx}`
          const u = (patch: Partial<InsuredData>) => updateInsured(ins.uid, patch)
          return (
            <div key={ins.uid} className="border border-[#d0cdc8] rounded p-4 bg-[#fdfcfa]" style={{ position: 'relative' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-navy uppercase tracking-[0.05em]">{title}</span>
                {!isPrimary && (
                  <button
                    onClick={() => removeInsured(ins.uid)}
                    className="border border-[#e0a0a0] text-[#c0504d] text-[11px] font-bold px-2.5 py-0.5 rounded hover:bg-[#fdf0f0] transition-colors"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              <div className="flex gap-3.5 flex-wrap mb-3">
                <Field label="First Name" className="flex-[2] min-w-28" autofilled={a(ins.uid, 'first')}>
                  <input value={ins.first} onChange={e => u({ first: e.target.value })} className={inputCls(a(ins.uid, 'first'))} />
                </Field>
                <Field label="Middle Name" className="flex-[2] min-w-24" autofilled={a(ins.uid, 'middle')}>
                  <input value={ins.middle} onChange={e => u({ middle: e.target.value })} className={inputCls(a(ins.uid, 'middle'))} />
                </Field>
                <Field label="Last Name" className="flex-[3] min-w-32" autofilled={a(ins.uid, 'last')}>
                  <input value={ins.last} onChange={e => u({ last: e.target.value })} className={inputCls(a(ins.uid, 'last'))} />
                </Field>
                <Field label="Suffix" className="w-20" autofilled={a(ins.uid, 'suffix')} badgeRight="right-7">
                  <select value={ins.suffix} onChange={e => u({ suffix: e.target.value })} className={selectCls(a(ins.uid, 'suffix'))}>
                    <option value=""></option>
                    {['Jr','Sr','II','III','IV'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              <div className="flex gap-3.5 flex-wrap mb-3">
                <Field label="Date of Birth" className="w-32" autofilled={a(ins.uid, 'dob')}>
                  <input
                    value={ins.dob}
                    onChange={e => u({ dob: formatDate(e.target.value) })}
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
                    className={inputCls(a(ins.uid, 'dob'))}
                  />
                </Field>
                <Field label="Social Security #" className="w-36" autofilled={a(ins.uid, 'ssn')}>
                  <input
                    value={ins.ssn}
                    onChange={e => u({ ssn: formatSSN(e.target.value) })}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className={inputCls(a(ins.uid, 'ssn'))}
                  />
                </Field>
                <Field label="Marital Status" className="flex-1 min-w-32" autofilled={a(ins.uid, 'marital')} badgeRight="right-7">
                  <select value={ins.marital} onChange={e => u({ marital: e.target.value })} className={selectCls(a(ins.uid, 'marital'))}>
                    <option value="">Select…</option>
                    {['Married','Single','Divorced','Widowed'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Occupation" className="flex-[2] min-w-36" autofilled={a(ins.uid, 'occupation')}>
                  <input value={ins.occupation} onChange={e => u({ occupation: e.target.value })} className={inputCls(a(ins.uid, 'occupation'))} />
                </Field>
              </div>

              {isPrimary ? (
                <div className="flex gap-3.5 flex-wrap">
                  <Field label="Phone" className="w-44" autofilled={a(ins.uid, 'phone')}>
                    <input
                      value={ins.phone}
                      onChange={e => u({ phone: formatPhone(e.target.value) })}
                      placeholder="(XXX) XXX-XXXX"
                      maxLength={14}
                      className={inputCls(a(ins.uid, 'phone'))}
                    />
                  </Field>
                  <Field label="Email" className="flex-[2] min-w-48" autofilled={a(ins.uid, 'email')}>
                    <input type="email" value={ins.email} onChange={e => u({ email: e.target.value })} className={inputCls(a(ins.uid, 'email'))} />
                  </Field>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => u({ showContact: !ins.showContact })}
                    className="text-[11px] font-bold text-navy border border-dashed border-navy/50 rounded px-3 py-1 hover:bg-[#f0ede8] transition-colors"
                  >
                    {ins.showContact ? '− Contact Info' : '+ Contact Info'}
                  </button>
                  {ins.showContact && (
                    <div className="flex gap-3.5 flex-wrap mt-2">
                      <Field label="Phone" className="w-44" autofilled={a(ins.uid, 'phone')}>
                        <input
                          value={ins.phone}
                          onChange={e => u({ phone: formatPhone(e.target.value) })}
                          placeholder="(XXX) XXX-XXXX"
                          maxLength={14}
                          className={inputCls(a(ins.uid, 'phone'))}
                        />
                      </Field>
                      <Field label="Email" className="flex-[2] min-w-48" autofilled={a(ins.uid, 'email')}>
                        <input type="email" value={ins.email} onChange={e => u({ email: e.target.value })} className={inputCls(a(ins.uid, 'email'))} />
                      </Field>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button
        onClick={addInsured}
        className="mt-3.5 text-[13px] font-bold text-navy border border-dashed border-navy rounded px-4 py-2 hover:bg-[#f0ede8] transition-colors inline-flex items-center gap-1.5"
      >
        + Add Named Insured
      </button>
    </SectionCard>
  )
}
