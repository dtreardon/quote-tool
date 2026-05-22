'use client'

import { type ReactNode } from 'react'

interface FieldProps {
  label: string
  children: ReactNode
  className?: string
  flash?: boolean
}

export function Field({ label, children, className = '', flash = false }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[11px] font-semibold text-navy uppercase tracking-[0.03em] leading-none">
        {label}
      </label>
      <div className={flash ? 'ring-2 ring-amber-400 ring-offset-1 rounded' : ''}>
        {children}
      </div>
    </div>
  )
}

export const inputCls = (flash?: boolean) =>
  `w-full rounded border px-2.5 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-colors ${
    flash ? 'bg-amber-50 border-amber-300' : 'border-[#d0cdc8] bg-white'
  }`

export const selectCls = (flash?: boolean) =>
  `w-full rounded border pl-2.5 pr-7 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold bg-white transition-colors ${
    flash ? 'bg-amber-50 border-amber-300' : 'border-[#d0cdc8]'
  }`
