'use client'

import { useAutoForm } from './AutoFormContext'
import { buildAutoPrintHTML } from '@/lib/buildAutoPrintHTML'

interface AutoActionBarProps {
  onClear: () => void
}

export function AutoActionBar({ onClear }: AutoActionBarProps) {
  const { form } = useAutoForm()

  function handlePrint() {
    const logoUrl = `${window.location.origin}/logo-white.png`
    const html = buildAutoPrintHTML(form, logoUrl)
    const printWin = window.open('', '_blank', 'width=900,height=1100')
    if (!printWin) { alert('Please allow pop-ups for this site to print.'); return }
    printWin.document.write(html)
    printWin.document.close()
    printWin.onload = () => { printWin.focus(); printWin.print() }
  }

  return (
    <div className="sticky bottom-0 bg-navy flex items-center justify-between px-6 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 print:hidden">
      <div className="flex flex-col gap-0.5">
        <span className="text-white/60 text-xs">
          Robinson &amp; Associates — Auto Quote Sheet{' '}
          <span className="text-[11px] ml-2" style={{ color: '#e8b44a' }}>v3.2</span>
        </span>
        <span className="text-white/40 text-[11px]">QuoteSheetPRO is a product of Reardon Insurance, LLC © 2026 — All Rights Reserved</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="border border-white/30 text-white px-[22px] py-2.5 rounded text-sm font-bold hover:bg-white/10 transition-colors"
        >
          Clear Form
        </button>
        <button
          onClick={handlePrint}
          className="bg-gold hover:bg-gold-light text-white px-[22px] py-2.5 rounded text-sm font-bold transition-colors"
          style={{ transition: 'background-color 0.15s, transform 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
        >
          🖨 Print / Save PDF
        </button>
      </div>
    </div>
  )
}
