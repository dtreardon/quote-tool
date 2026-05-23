'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname === '/login') return null
  return (
    <header className="bg-navy sticky top-0 z-50 shadow-lg print:hidden">
      <div className="max-w-[980px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo-blue.png" alt="Robinson & Associates" height={56} width={140} className="object-contain" priority />
        </div>
        <div className="text-right font-serif whitespace-nowrap">
          <div className="flex flex-col items-end gap-0.5">
            <strong className="text-white text-sm leading-tight">Homeowners &amp; Flood</strong>
            <span className="text-white/70 text-xs tracking-wide">Quote Sheet</span>
          </div>
        </div>
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #c8922a, #e8b44a, #c8922a)' }} />
    </header>
  )
}
