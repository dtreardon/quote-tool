'use client'

import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

const SHEET_OPTIONS = [
  { value: '/',     label: 'Homeowners & Flood' },
  { value: '/auto', label: 'Personal Auto' },
]

export function ConditionalHeader() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/login') return null

  const current = SHEET_OPTIONS.find(o => o.value === pathname) ?? SHEET_OPTIONS[0]

  return (
    <header className="bg-navy sticky top-0 z-50 shadow-lg print:hidden">
      <div className="max-w-[980px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo-blue.png" alt="Robinson & Associates" height={56} width={140} className="object-contain" priority />
        </div>
        <div className="text-right font-serif whitespace-nowrap">
          <div className="flex flex-col items-end gap-1">
            <select
              value={current.value}
              onChange={e => router.push(e.target.value)}
              className="rounded border border-white/30 bg-white/15 text-white pl-2.5 pr-7 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-gold [&>option]:bg-navy [&>option]:text-white cursor-pointer"
            >
              {SHEET_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="text-white/70 text-xs tracking-wide">Quote Sheet</span>
          </div>
        </div>
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #c8922a, #e8b44a, #c8922a)' }} />
    </header>
  )
}
