'use client'

import { useState } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { buildPrintHTML } from '@/lib/buildPrintHTML'
import { useSaveFolder } from '@/lib/useSaveFolder'
import type { FormState } from '@/app/types/form'

interface ActionBarProps {
  onClear: () => void
}

function buildFilename(form: FormState): string {
  const primary = form.insureds[0]
  const isEntity = primary?.insuredType === 'entity'
  const base = isEntity
    ? `${(primary?.entityName || '').toUpperCase()} ${form.policy_type || 'HO'} QUOTE SHEET ${form.prop_street || ''}`
    : `${(primary?.last || '').toUpperCase()}, ${(primary?.first || '').toUpperCase()} ${form.policy_type || 'HO'} QUOTE SHEET ${form.prop_street || ''}`
  return base.trim() + '.pdf'
}

function downloadPDF(bytes: ArrayBuffer, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function printFallback(html: string) {
  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) { alert('Please allow pop-ups for this site to print.'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

export function ActionBar({ onClear }: ActionBarProps) {
  const { form } = useQuoteForm()
  const { isSupported, folderName, pickFolder, clearFolder, saveFile } = useSaveFolder()
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const logoUrl = `${window.location.origin}/logo-white.png`
    const html = buildPrintHTML(form, logoUrl)
    const filename = buildFilename(form)

    // If File System Access API is not supported, fall back to window.print()
    if (!isSupported) {
      printFallback(html)
      setSaving(false)
      return
    }

    // Request server-side PDF, then write to the saved folder
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
      })

      if (!res.ok) throw new Error(await res.text())

      const buffer = await res.arrayBuffer()
      const result = await saveFile(filename, buffer)

      if (result === 'failed') {
        // User cancelled the folder picker — download as fallback
        downloadPDF(buffer, filename)
      }
    } catch (err) {
      // Server PDF unavailable — fall back to print dialog
      console.warn('[ActionBar] PDF server failed, falling back to print:', err)
      printFallback(html)
    } finally {
      setSaving(false)
    }
  }

  const FOLDER_TOOLTIP =
    'Save folder is stored in this browser profile only — ' +
    'each machine/browser you use needs to be set up once.'

  return (
    <div className="sticky bottom-0 bg-navy flex items-center justify-between px-6 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 print:hidden">
      <div className="flex flex-col gap-0.5">
        <span className="text-white/60 text-xs">
          Robinson &amp; Associates — Homeowners &amp; Flood Quote Sheet{' '}
          <span className="text-[11px] ml-2" style={{ color: '#e8b44a' }}>v3.2</span>
        </span>
        <span className="text-white/40 text-[11px]">QuoteSheetPRO is a product of Reardon Insurance, LLC © 2026 — All Rights Reserved</span>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="border border-white/30 text-white px-[22px] py-2.5 rounded text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Clear Form
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold hover:bg-gold-light text-white px-[22px] py-2.5 rounded text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ transition: 'background-color 0.15s, transform 0.15s' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = '' }}
          >
            {saving ? 'Saving…' : '🖨 Print / Save PDF'}
          </button>
        </div>

        {/* Save-folder status — only shown when FS API is supported */}
        {isSupported && (
          <div className="flex items-center gap-2 text-[11px]" title={FOLDER_TOOLTIP}>
            {folderName ? (
              <>
                <span className="text-white/40">📁</span>
                <span className="text-white/50 max-w-[200px] truncate" title={folderName}>
                  {folderName}
                </span>
                <button
                  onClick={pickFolder}
                  title={FOLDER_TOOLTIP}
                  className="text-white/40 hover:text-white/70 underline transition-colors"
                >
                  change
                </button>
                <button
                  onClick={clearFolder}
                  title="Stop auto-saving to this folder"
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <span className="text-white/30">📁 No save folder —</span>
                <button
                  onClick={pickFolder}
                  title={FOLDER_TOOLTIP}
                  className="text-white/50 hover:text-white/80 underline transition-colors"
                >
                  set up auto-save
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
