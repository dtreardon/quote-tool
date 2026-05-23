'use client'
import { formatDollar } from '@/lib/formatters'

interface DollarInputProps {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

export function DollarInput({ value, onChange, onBlur, placeholder, className = '' }: DollarInputProps) {
  return (
    <div className="flex items-stretch">
      <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-[#d0cdc8] bg-[#f0ede8] text-[#666] text-[13px] font-semibold select-none">
        $
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(formatDollar(e.target.value))}
        onBlur={onBlur}
        className={`flex-1 min-w-0 rounded-r border border-[#d0cdc8] px-2.5 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-colors bg-white ${className}`}
      />
    </div>
  )
}
