'use client'

import { type ReactNode } from 'react'

interface SectionCardProps {
  number?: number | string
  title: string
  children: ReactNode
  className?: string
  accent?: 'gold' | 'navy'
}

export function SectionCard({ number, title, children, className = '', accent }: SectionCardProps) {
  const badgeBg = accent === 'gold' ? 'bg-gold' : 'bg-gold'
  return (
    <div className={`rounded-md border border-[#d0cdc8] overflow-hidden mb-[18px] ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(51,78,133,0.10)' }}>
      <div className="bg-navy flex items-center gap-[10px] px-5 py-[10px]">
        {number !== undefined && (
          <span className={`${badgeBg} text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0`}>
            {number}
          </span>
        )}
        <h2 className="text-white font-bold font-serif text-[13px] uppercase tracking-[0.06em]">{title}</h2>
      </div>
      <div className="bg-white p-5">{children}</div>
    </div>
  )
}
