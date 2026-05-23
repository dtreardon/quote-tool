'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field, inputCls, selectCls } from '../ui/Field'
import { YesNo } from '../ui/RadioGroup'

export function Section5() {
  const { form, update, autofilledFields } = useQuoteForm()
  const a = (key: string) => autofilledFields.has(key)
  const isMH = form.policy_type === 'MH'

  return (
    <SectionCard number={5} title="Property Details">
      {/* Row 1: Basic stats */}
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Year Built" className="w-24" autofilled={a('year_built')}>
          <input value={form.year_built} onChange={e => update({ year_built: e.target.value })} placeholder="YYYY" className={inputCls(a('year_built'))} />
        </Field>
        <Field label="# Stories" className="w-20" autofilled={a('num_stories')}>
          <input type="number" min={1} value={form.num_stories} onChange={e => update({ num_stories: e.target.value })} className={inputCls(a('num_stories'))} />
        </Field>
        <Field label="Sq Footage" className="w-28" autofilled={a('sqft')}>
          <input value={form.sqft} onChange={e => update({ sqft: e.target.value })} className={inputCls(a('sqft'))} />
        </Field>
        <Field label="Beds" className="w-16" autofilled={a('beds')}>
          <input type="number" min={0} value={form.beds} onChange={e => update({ beds: e.target.value })} className={inputCls(a('beds'))} />
        </Field>
        <Field label="Full Baths" className="w-20" autofilled={a('full_baths')}>
          <input type="number" min={0} value={form.full_baths} onChange={e => update({ full_baths: e.target.value })} className={inputCls(a('full_baths'))} />
        </Field>
        <Field label="Half Baths" className="w-20" autofilled={a('half_baths')}>
          <input type="number" min={0} value={form.half_baths} onChange={e => update({ half_baths: e.target.value })} className={inputCls(a('half_baths'))} />
        </Field>
      </div>

      {/* Row 2: Construction & Foundation */}
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Construction Type" className="flex-[2] min-w-40">
          <select value={form.construction_type} onChange={e => update({ construction_type: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['Brick','Hardi','Vinyl','Stone','Stucco','Tabby','Wood','Cinderblock'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Foundation Type" className="flex-[2] min-w-40">
          <select value={form.foundation_type} onChange={e => update({ foundation_type: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['Slab','Crawlspace','Raised Slab','Enclosure','Piers','Basement'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>

      {/* Row 3: Garage, HVAC, Laundry */}
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Garage Type" className="flex-[2] min-w-40">
          <select value={form.garage_type} onChange={e => update({ garage_type: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['None','Attached / Built-in','Detached','Carport'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="# of Cars" className="w-20">
          <input type="number" min={0} value={form.garage_cars} onChange={e => update({ garage_cars: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Heat / Air Type" className="flex-[2] min-w-44">
          <select value={form.heat_air} onChange={e => update({ heat_air: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['Central Heat & Air','Central Heat / Window AC','Window Units Only','Baseboard','Radiator','Mini-Split','None'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Laundry Floor" className="flex-1 min-w-28">
          <input value={form.laundry_floor} onChange={e => update({ laundry_floor: e.target.value })} className={inputCls()} />
        </Field>
      </div>

      {/* MH sub-section */}
      {isMH && (
        <div className="border border-[#d0cdc8] rounded p-[14px] bg-[#f7f4ee] mb-3">
          <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] mb-3">Manufactured Home Details</div>
          <div className="flex gap-3.5 flex-wrap mb-3">
            <Field label="Make" className="flex-[2] min-w-36">
              <input value={form.mh_make} onChange={e => update({ mh_make: e.target.value })} className={inputCls()} />
            </Field>
            <Field label="Model" className="flex-[2] min-w-36">
              <input value={form.mh_model} onChange={e => update({ mh_model: e.target.value })} className={inputCls()} />
            </Field>
            <Field label="Configuration" className="flex-1 min-w-36">
              <select value={form.mh_config} onChange={e => update({ mh_config: e.target.value })} className={selectCls()}>
                <option value="">Select…</option>
                {['Single Wide','Double Wide','Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex gap-3.5 flex-wrap">
            <Field label="Location" className="flex-1 min-w-36">
              <select value={form.mh_location} onChange={e => update({ mh_location: e.target.value })} className={selectCls()}>
                <option value="">Select…</option>
                {['In Park','Private Property'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Length (ft)" className="w-24">
              <input value={form.mh_length} onChange={e => update({ mh_length: e.target.value })} className={inputCls()} />
            </Field>
            <Field label="Width (ft)" className="w-24">
              <input value={form.mh_width} onChange={e => update({ mh_width: e.target.value })} className={inputCls()} />
            </Field>
            <Field label="Serial Number" className="flex-[2] min-w-40">
              <input value={form.mh_serial} onChange={e => update({ mh_serial: e.target.value })} className={inputCls()} />
            </Field>
          </div>
        </div>
      )}

      <hr className="border-[#d0cdc8] mb-3" />
      <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] mb-2">Renovations & Systems</div>

      {/* Roof */}
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Roof Year" className="w-[100px]">
          <input value={form.reno_roof} onChange={e => update({ reno_roof: e.target.value })} placeholder="YYYY" className={inputCls()} />
        </Field>
        <Field label="Roof Shape" className="flex-1 min-w-36">
          <select value={form.roof_shape} onChange={e => update({ roof_shape: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['Gable','Hip','Flat','Gambrel','Mansard','Other'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Roof Type" className="flex-1 min-w-36">
          <select value={form.roof_type} onChange={e => update({ roof_type: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['Architectural','3-Tab','Metal','Tile','Wood Shake','Flat/TPO','Other'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Scope" className="w-[100px]">
          <select value={form.reno_roof_scope} onChange={e => update({ reno_roof_scope: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            <option>Full</option><option>Partial</option>
          </select>
        </Field>
      </div>

      {/* Electrical, HVAC, Plumbing, Water Heater */}
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Elec Year" className="w-[70px]">
          <input value={form.reno_elec} onChange={e => update({ reno_elec: e.target.value })} placeholder="YYYY" className={inputCls()} />
        </Field>
        <Field label="Scope" className="w-[100px]">
          <select value={form.reno_elec_scope} onChange={e => update({ reno_elec_scope: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            <option>Full</option><option>Partial</option>
          </select>
        </Field>
        <Field label="HVAC Year" className="w-[70px]">
          <input value={form.reno_hvac} onChange={e => update({ reno_hvac: e.target.value })} placeholder="YYYY" className={inputCls()} />
        </Field>
        <Field label="Scope" className="w-[100px]">
          <select value={form.reno_hvac_scope} onChange={e => update({ reno_hvac_scope: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            <option>Full</option><option>Partial</option>
          </select>
        </Field>
        <Field label="Plumb Year" className="w-[70px]">
          <input value={form.reno_plum} onChange={e => update({ reno_plum: e.target.value })} placeholder="YYYY" className={inputCls()} />
        </Field>
        <Field label="Scope" className="w-[100px]">
          <select value={form.reno_plum_scope} onChange={e => update({ reno_plum_scope: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            <option>Full</option><option>Partial</option>
          </select>
        </Field>
        <Field label="Water Htr" className="w-[70px]">
          <input value={form.water_heater} onChange={e => update({ water_heater: e.target.value })} placeholder="YYYY" className={inputCls()} />
        </Field>
        <Field label="Tankless?">
          <div className="flex gap-3 mt-1">
            {['yes','no'].map(v => (
              <label key={v} className="flex items-center gap-1.5 cursor-pointer text-[13px]">
                <input type="radio" name="tankless" value={v} checked={form.tankless === v} onChange={() => update({ tankless: v })} className="accent-navy" />
                {v === 'yes' ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <hr className="border-[#d0cdc8] mb-3" />
      <div className="text-[11px] font-bold text-[#666] uppercase tracking-[0.05em] mb-2">Safety & Features</div>

      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Fire Alarm" className="flex-1 min-w-36">
          <select value={form.fire_alarm} onChange={e => update({ fire_alarm: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['None','Local','Central Station','Direct','Smart'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Burglar Alarm" className="flex-1 min-w-36">
          <select value={form.burglar_alarm} onChange={e => update({ burglar_alarm: e.target.value })} className={selectCls()}>
            <option value="">Select…</option>
            {['None','Local','Central Station','Direct','Smart'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Sprinklered?">
          <YesNo name="sprinklered" value={form.sprinklered} onChange={v => update({ sprinklered: v })} />
        </Field>
        {form.sprinklered === 'yes' && (
          <Field label="Sprinkler Floor" className="w-28">
            <input value={form.sprinkler_floor} onChange={e => update({ sprinkler_floor: e.target.value })} className={inputCls()} />
          </Field>
        )}
        <Field label="Gated Community?">
          <YesNo name="gated" value={form.gated} onChange={v => update({ gated: v })} />
        </Field>
      </div>

      <div className="flex gap-3.5 flex-wrap">
        <Field label="# Fireplaces" className="w-28">
          <input type="number" min={0} value={form.fireplaces} onChange={e => update({ fireplaces: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Pool?">
          <YesNo name="pool" value={form.pool} onChange={v => update({ pool: v })} />
        </Field>
        {form.pool === 'yes' && (
          <Field label="Pool Features" className="flex-[3]">
            <div className="flex gap-4 mt-1 flex-wrap">
              {[
                { key: 'pool_diving', label: 'Diving Board' },
                { key: 'pool_slide', label: 'Slide' },
                { key: 'pool_fenced', label: 'Fenced w/ Gate' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer text-[13px]">
                  <input
                    type="checkbox"
                    checked={form[key as 'pool_diving' | 'pool_slide' | 'pool_fenced']}
                    onChange={e => update({ [key]: e.target.checked } as Partial<typeof form>)}
                    className="accent-navy w-[15px] h-[15px]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
        )}
        <Field label="Trampoline?">
          <YesNo name="trampoline" value={form.trampoline} onChange={v => update({ trampoline: v })} />
        </Field>
      </div>
    </SectionCard>
  )
}
