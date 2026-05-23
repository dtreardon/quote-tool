'use client'
import { type ReactNode } from 'react'
import { AutofillBadge } from './AutofillBadge'

interface FieldProps {
  label: string
  children: ReactNode
  className?: string
  autofilled?: boolean
  badgeOutside?: boolean
}

export function Field({ label, children, className = '', autofilled = false, badgeOutside = false }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[11px] font-semibold text-navy uppercase tracking-[0.03em] leading-none">
        {label}
      </label>
      <div className="relative">
        {children}
        {autofilled && (
          badgeOutside
            ? <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1 z-10"><AutofillBadge /></span>
            : <span className="absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-auto"><AutofillBadge /></span>
        )}
      </div>
    </div>
  )
}

export const inputCls = (autofilled = false) =>
  `w-full rounded border pl-2.5 ${autofilled ? 'pr-8' : 'pr-2.5'} py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-colors border-[#d0cdc8] bg-white`

export const selectCls = () =>
  `w-full rounded border pl-2.5 pr-7 py-[7px] text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold bg-white transition-colors border-[#d0cdc8]`
