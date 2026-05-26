'use client'

import { useState, useEffect, useRef } from 'react'
import { useAutoForm } from './AutoFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { StateSelect } from '../ui/StateSelect'
import { YesNo } from '../ui/RadioGroup'
import type { VehicleData } from '@/app/types/autoForm'

let nextVehUid = 2

function blankVehicle(): VehicleData {
  return {
    uid: nextVehUid++,
    type: '', commercial_use: false,
    vin: '', year: '', make: '', model: '', color: '',
    annual_mileage: '', comp: '', collision: '',
    comp_ded: '', collision_ded: '',
    lienholder_name: '', lienholder_street: '', lienholder_city: '',
    lienholder_state: '', lienholder_zip: '', loan_number: '',
    notes: '',
  }
}

const DEDUCTIBLES = ['','500','1,000','2,000','2,500']
const VEHICLE_TYPES = [
  '', 'Private Passenger', 'Truck', 'SUV', 'Van',
  'Motorcycle', 'RV', 'Golf Cart', 'LSV (Low Speed Vehicle)', 'Other',
]

function useVinDecode(vin: string, onResult: (year: string, make: string, model: string) => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (vin.length !== 17) return
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`)
        if (!res.ok) return
        const data = await res.json()
        const r = data?.Results?.[0]
        if (!r) return
        const year  = r.ModelYear  || ''
        const make  = r.Make  ? r.Make.charAt(0).toUpperCase()  + r.Make.slice(1).toLowerCase()  : ''
        const model = r.Model ? r.Model.charAt(0).toUpperCase() + r.Model.slice(1).toLowerCase() : ''
        if (year || make || model) onResult(year, make, model)
      } catch { /* ignore */ }
    }, 600)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [vin]) // eslint-disable-line react-hooks/exhaustive-deps
}

interface VehicleCardProps {
  veh: VehicleData
  index: number
  onUpdate: (patch: Partial<VehicleData>) => void
  onRemove: () => void
  flashKeys: Set<string>
}

function VehicleCard({ veh, index, onUpdate, onRemove, flashKeys }: VehicleCardProps) {
  const [open, setOpen] = useState(true)
  const [lienOpen, setLienOpen] = useState(false)
  const isFlashing = (f: string) => flashKeys.has(`veh_${veh.uid}_${f}`)

  useVinDecode(veh.vin, (year, make, model) => {
    onUpdate({ year, make, model })
  })

  const yearStr = veh.year || veh.make || veh.model
    ? [veh.year, veh.make, veh.model].filter(Boolean).join(' ')
    : `Vehicle ${index + 1}`

  return (
    <div className="border border-[#d0cdc8] rounded bg-[#fdfcfa]">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-[13px] font-bold text-navy">{yearStr}</span>
          {veh.commercial_use && <span className="text-[11px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">Commercial</span>}
          {veh.vin && <span className="text-[11px] text-gray-400 font-mono">{veh.vin}</span>}
        </div>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="border border-[#e0a0a0] text-[#c0504d] text-[11px] font-bold px-2.5 py-0.5 rounded hover:bg-[#fdf0f0] transition-colors"
            >
              ✕ Remove
            </button>
          )}
          <span className="text-gray-400 text-sm">{open ? '▲' : '▾'}</span>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-[#d0cdc8]">
          {/* VIN / Serial # + Type + Commercial Use */}
          <div className="flex gap-3.5 flex-wrap mt-3 mb-3">
            <Field label="VIN / Serial #" className="flex-[3] min-w-48">
              <input
                value={veh.vin}
                onChange={e => onUpdate({ vin: e.target.value.toUpperCase() })}
                maxLength={25}
                placeholder="Enter VIN or serial number"
                className={`${inputCls()} font-mono`}
              />
            </Field>
            <Field label="Type" className="w-52">
              <select value={veh.type} onChange={e => onUpdate({ type: e.target.value })} className={selectCls()}>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t || 'Select…'}</option>)}
              </select>
            </Field>
            <div className="flex flex-col gap-1 justify-end">
              <label className="flex items-center gap-2 text-[13px] font-semibold text-navy cursor-pointer pb-[9px]">
                <input
                  type="checkbox"
                  checked={veh.commercial_use}
                  onChange={e => onUpdate({ commercial_use: e.target.checked })}
                  className="w-4 h-4 accent-navy"
                />
                Commercial Use?
              </label>
            </div>
          </div>

          {/* Year, Make, Model, Color, Mileage */}
          <div className="flex gap-3.5 flex-wrap mb-3">
            <Field label="Year" className="w-20">
              <input value={veh.year} onChange={e => onUpdate({ year: e.target.value })} maxLength={4} placeholder="YYYY" className={inputCls(isFlashing('year'))} />
            </Field>
            <Field label="Make" className="flex-1 min-w-32">
              <input value={veh.make} onChange={e => onUpdate({ make: e.target.value })} className={inputCls(isFlashing('make'))} />
            </Field>
            <Field label="Model" className="flex-[2] min-w-36">
              <input value={veh.model} onChange={e => onUpdate({ model: e.target.value })} className={inputCls(isFlashing('model'))} />
            </Field>
            <Field label="Color" className="w-28">
              <input value={veh.color} onChange={e => onUpdate({ color: e.target.value })} className={inputCls()} />
            </Field>
            <Field label="Annual Mileage" className="w-32">
              <input value={veh.annual_mileage} onChange={e => onUpdate({ annual_mileage: e.target.value })} placeholder="e.g. 12,000" className={inputCls()} />
            </Field>
          </div>

          {/* Comp / Collision */}
          <div className="flex gap-3.5 flex-wrap mb-3">
            <Field label="Comprehensive?" className="flex-shrink-0" badgeOutside>
              <YesNo name={`comp_${veh.uid}`} value={veh.comp} onChange={v => onUpdate({ comp: v })} />
            </Field>
            {veh.comp === 'yes' && (
              <Field label="Comp Deductible" className="w-32">
                <select value={veh.comp_ded} onChange={e => onUpdate({ comp_ded: e.target.value })} className={selectCls()}>
                  {DEDUCTIBLES.map(d => <option key={d} value={d}>{d || 'Select…'}</option>)}
                </select>
              </Field>
            )}
            <Field label="Collision?" className="flex-shrink-0" badgeOutside>
              <YesNo name={`collision_${veh.uid}`} value={veh.collision} onChange={v => onUpdate({ collision: v })} />
            </Field>
            {veh.collision === 'yes' && (
              <Field label="Collision Deductible" className="w-32">
                <select value={veh.collision_ded} onChange={e => onUpdate({ collision_ded: e.target.value })} className={selectCls()}>
                  {DEDUCTIBLES.map(d => <option key={d} value={d}>{d || 'Select…'}</option>)}
                </select>
              </Field>
            )}
          </div>

          {/* Lienholder / Lender */}
          {!lienOpen ? (
            <button
              type="button"
              onClick={() => setLienOpen(true)}
              className="text-sm font-semibold text-navy hover:text-gold transition-colors flex items-center gap-1.5 mb-3"
            >
              <span className="text-base leading-none">+</span> Add Lienholder / Lender
            </button>
          ) : (
            <div className="bg-[#f7f4ee] border border-[#d0cdc8] rounded p-3.5 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em]">Lienholder / Lender</div>
                <button
                  type="button"
                  onClick={() => setLienOpen(false)}
                  className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  − hide
                </button>
              </div>
              <div className="flex gap-3.5 flex-wrap mb-2">
                <Field label="Lienholder Name" className="flex-[3] min-w-60">
                  <input
                    value={veh.lienholder_name}
                    onChange={e => onUpdate({ lienholder_name: e.target.value })}
                    placeholder="e.g. First National Bank ISAOA/ATIMA"
                    className={inputCls()}
                  />
                </Field>
              </div>
              <div className="flex gap-3.5 flex-wrap mb-2">
                <Field label="Street Address" className="flex-[3] min-w-48">
                  <input value={veh.lienholder_street} onChange={e => onUpdate({ lienholder_street: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="City" className="flex-[2] min-w-36">
                  <input value={veh.lienholder_city} onChange={e => onUpdate({ lienholder_city: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="State" className="w-20" badgeRight="right-7">
                  <StateSelect value={veh.lienholder_state} onChange={v => onUpdate({ lienholder_state: v })} />
                </Field>
                <Field label="ZIP" className="w-24">
                  <input value={veh.lienholder_zip} onChange={e => onUpdate({ lienholder_zip: e.target.value })} maxLength={10} className={inputCls()} />
                </Field>
              </div>
              <div className="flex gap-3.5">
                <Field label="Loan Number" className="w-52">
                  <input value={veh.loan_number} onChange={e => onUpdate({ loan_number: e.target.value })} className={inputCls()} />
                </Field>
              </div>
            </div>
          )}

          <Field label="Vehicle Notes" className="w-full">
            <input value={veh.notes} onChange={e => onUpdate({ notes: e.target.value })} placeholder="Salvage, custom equipment, modifications, etc." className={inputCls()} />
          </Field>
        </div>
      )}
    </div>
  )
}

export function Section4() {
  const { form, update } = useAutoForm()
  const [flashKeys, setFlashKeys] = useState<Set<string>>(new Set())

  function addVehicle() {
    update({ vehicles: [...form.vehicles, blankVehicle()] })
  }

  function removeVehicle(uid: number) {
    update({ vehicles: form.vehicles.filter(v => v.uid !== uid) })
  }

  function updateVehicle(uid: number, patch: Partial<VehicleData>) {
    const isAutoFilled = Object.keys(patch).some(k => ['year', 'make', 'model'].includes(k))
    if (isAutoFilled) {
      const newKeys = new Set(flashKeys)
      Object.keys(patch).forEach(k => newKeys.add(`veh_${uid}_${k}`))
      setFlashKeys(newKeys)
      setTimeout(() => setFlashKeys(new Set()), 2500)
    }
    update({ vehicles: form.vehicles.map(v => v.uid === uid ? { ...v, ...patch } : v) })
  }

  return (
    <SectionCard number={4} title="Vehicles">
      <div className="space-y-3">
        {form.vehicles.map((veh, idx) => (
          <VehicleCard
            key={veh.uid}
            veh={veh}
            index={idx}
            onUpdate={patch => updateVehicle(veh.uid, patch)}
            onRemove={() => removeVehicle(veh.uid)}
            flashKeys={flashKeys}
          />
        ))}
      </div>
      <button
        onClick={addVehicle}
        className="mt-3.5 text-[13px] font-bold text-navy border border-dashed border-navy rounded px-4 py-2 hover:bg-[#f0ede8] transition-colors inline-flex items-center gap-1.5"
      >
        + Add Vehicle
      </button>
    </SectionCard>
  )
}
