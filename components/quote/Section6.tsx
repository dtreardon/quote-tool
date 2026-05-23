'use client'

import { useState } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'
import { Field } from '../ui/Field'
import { DollarInput } from '../ui/DollarInput'
import { expandLiability, expandMedPay } from '@/lib/formatters'

const LIABILITY_OPTIONS = ['100,000', '300,000', '500,000', '1,000,000']
const MED_PAY_OPTIONS  = ['1,000', '3,000', '5,000', '10,000']

function CovInput({
  value, onChange, onExpand, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onExpand: () => void
  options: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <div className={`flex items-stretch rounded border overflow-hidden border-[#d0cdc8]`}>
        <span className="inline-flex items-center px-2 bg-[#f0ede8] border-r border-[#d0cdc8] text-[#666] text-[13px] font-semibold select-none flex-shrink-0">
          $
        </span>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => { onExpand(); setOpen(false) }}
          placeholder={placeholder}
          className={`flex-1 min-w-0 px-2.5 py-[7px] text-sm focus:outline-none bg-white`}
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
          className="px-2 bg-[#f0ede8] border-l border-[#d0cdc8] text-[10px] text-[#888] hover:bg-[#e8e4de] flex-shrink-0 transition-colors"
        >
          ▾
        </button>
      </div>
      {open && (
        <div className="absolute z-20 left-0 right-0 top-full mt-px bg-white border border-[#d0cdc8] rounded shadow-md overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              tabIndex={-1}
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[#f0ede8] transition-colors ${
                value === opt ? 'bg-[#f0ede8] font-semibold text-navy' : ''
              }`}
            >
              ${opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function calcPctDollar(pctStr: string, baseStr: string): string {
  const pct = parseFloat(pctStr)
  const base = parseFloat(baseStr.replace(/,/g, ''))
  if (!pct || !base || isNaN(pct) || isNaN(base)) return ''
  const equiv = Math.round(base * pct / 100)
  return `≈ $${equiv.toLocaleString('en-US', { maximumFractionDigits: 0 })} based on dwelling`
}

function DedToggle({ mode, onModeChange }: { mode: '$' | '%'; onModeChange: (m: '$' | '%') => void }) {
  return (
    <div className="flex border border-[#d0cdc8] rounded overflow-hidden flex-shrink-0">
      {(['$', '%'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onModeChange(m)}
          className={`px-[10px] text-xs font-bold cursor-pointer transition-colors ${
            mode === m ? 'bg-navy text-white' : 'bg-[#f0ede8] text-[#666] hover:bg-[#e8e4de]'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

function DedField({
  label,
  value,
  onChange,
  mode,
  onModeChange,
  hurType,
  onHurTypeChange,
  baseValue,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  mode: '$' | '%'
  onModeChange: (m: '$' | '%') => void
  hurType?: 'Hurricane' | 'Wind/Hail'
  onHurTypeChange?: (v: 'Hurricane' | 'Wind/Hail') => void
  baseValue?: string
}) {
  const pctHint = mode === '%' && baseValue ? calcPctDollar(value, baseValue) : ''
  return (
    <div className="flex flex-col gap-1">
      {hurType !== undefined ? (
        <label className="flex items-center gap-[6px] text-[11px] font-semibold text-navy uppercase tracking-[0.03em] leading-none">
          <span>{hurType} Deductible</span>
          <div className="flex border border-[#d0cdc8] rounded overflow-hidden flex-shrink-0 ml-1">
            {(['Hurricane', 'Wind/Hail'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => onHurTypeChange?.(opt)}
                className={`text-[10px] font-bold px-[6px] py-0.5 cursor-pointer transition-colors ${
                  hurType === opt ? 'bg-navy text-white' : 'bg-[#f0ede8] text-[#666] hover:bg-[#e8e4de]'
                }`}
              >
                {opt === 'Hurricane' ? 'HU' : 'W/H'}
              </button>
            ))}
          </div>
        </label>
      ) : (
        <label className="text-[11px] font-semibold text-navy uppercase tracking-[0.03em] leading-none">
          {label}
        </label>
      )}
      <div className="flex gap-[6px] items-stretch">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => {
            if (mode === '$') {
              const stripped = value.replace(/[,$\s]/g, '')
              const n = parseInt(stripped, 10)
              if (!isNaN(n) && n > 0) onChange(n.toLocaleString('en-US'))
            }
          }}
          className="flex-1 min-w-0 rounded border border-[#d0cdc8] px-2.5 py-[7px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-colors"
        />
        <DedToggle mode={mode} onModeChange={m => {
          if (m === '%' && mode === '$') onChange(value.replace(/,/g, ''))
          onModeChange(m)
        }} />
      </div>
      {pctHint && (
        <div className="text-[11px] font-semibold text-gold italic">{pctHint}</div>
      )}
    </div>
  )
}

export function Section6() {
  const { form, update } = useQuoteForm()

  return (
    <SectionCard number={6} title="Desired Coverage Amounts">
      <div className="flex gap-3.5 flex-wrap mb-3">
        <Field label="Dwelling (Cov A)" className="flex-1 min-w-36">
          <DollarInput value={form.cov_dwelling} onChange={v => update({ cov_dwelling: v })} />
        </Field>
        <Field label="Other Structures (Cov B)" className="flex-1 min-w-36">
          <DollarInput value={form.cov_other_structures} onChange={v => update({ cov_other_structures: v })} />
        </Field>
        <Field label="Contents (Cov C)" className="flex-1 min-w-36">
          <DollarInput value={form.cov_contents} onChange={v => update({ cov_contents: v })} />
        </Field>
        <Field label="Loss of Use (Cov D)" className="flex-1 min-w-36">
          <DollarInput value={form.cov_loss_of_use} onChange={v => update({ cov_loss_of_use: v })} />
        </Field>
      </div>
      <div className="flex gap-3.5 flex-wrap">
        <Field label="Liability (Cov E)" className="flex-1 min-w-36">
          <CovInput
            value={form.cov_liability}
            onChange={v => update({ cov_liability: v })}
            onExpand={() => update({ cov_liability: expandLiability(form.cov_liability) })}
            options={LIABILITY_OPTIONS}
          />
        </Field>
        <Field label="Medical Payments (Cov F)" className="flex-1 min-w-36">
          <CovInput
            value={form.cov_med_payments}
            onChange={v => update({ cov_med_payments: v })}
            onExpand={() => update({ cov_med_payments: expandMedPay(form.cov_med_payments) })}
            options={MED_PAY_OPTIONS}
          />
        </Field>
        <div className="flex-1 min-w-44">
          <DedField
            label="AOP Deductible"
            value={form.cov_aop_ded}
            onChange={v => update({ cov_aop_ded: v })}
            mode={form.aop_ded_mode}
            onModeChange={m => update({ aop_ded_mode: m })}
            baseValue={form.cov_dwelling}
          />
        </div>
        <div className="flex-1 min-w-52">
          <DedField
            label="Hurricane / Wind-Hail Deductible"
            value={form.cov_hurricane_ded}
            onChange={v => update({ cov_hurricane_ded: v })}
            mode={form.hur_ded_mode}
            onModeChange={m => update({ hur_ded_mode: m })}
            hurType={form.hur_type}
            onHurTypeChange={v => update({ hur_type: v })}
            baseValue={form.cov_dwelling}
          />
        </div>
      </div>
    </SectionCard>
  )
}
