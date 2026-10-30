'use client'
import { useState } from 'react'
import { formatMoney, type MoneyFormat } from '@/lib/formatters'

interface DollarInputProps {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  // 'cents' → 1,500.00 (premiums, sales price) · 'whole' → 86,000 (coverage limits, deductibles)
  format?: MoneyFormat
}

export function DollarInput({ value, onChange, onBlur, placeholder, className = '', format = 'cents' }: DollarInputProps) {
  // While focused the agent edits their raw text; otherwise the field always shows the
  // formatted value — including values set by auto-fill, ZLLW, or Recall.
  const [draft, setDraft] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value)
    onChange(e.target.value)
  }

  function handleBlur() {
    const formatted = formatMoney(draft ?? value, format)
    setDraft(null)
    if (formatted !== value) onChange(formatted)
    onBlur?.()
  }

  return (
    <div className="flex items-stretch">
      <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-[#d0cdc8] bg-[#f0ede8] text-[#666] text-[13px] font-semibold select-none">
        $
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? formatMoney(value, format)}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => setDraft(formatMoney(value, format))}
        onBlur={handleBlur}
        className={`flex-1 min-w-0 rounded-r border border-[#d0cdc8] px-2.5 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-colors bg-white ${className}`}
      />
    </div>
  )
}
