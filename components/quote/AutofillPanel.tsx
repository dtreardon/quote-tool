'use client'

import { useState, useRef } from 'react'
import { SectionCard } from '../ui/SectionCard'
import { useQuoteForm } from './QuoteFormContext'
import type { FormState } from '@/app/types/form'

interface AutofillPanelProps {
  onFlash: (fields: string[]) => void
  autofillEnabled?: boolean
}

export function AutofillPanel({ onFlash, autofillEnabled = false }: AutofillPanelProps) {
  const { form, update } = useQuoteForm()
  const [file, setFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'ok' | 'err' | ''>('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
  }

  async function runAutofill() {
    if (!file && !pasteText.trim()) {
      setStatus('Upload a file or paste text first.')
      setStatusType('err')
      return
    }

    setLoading(true)
    setStatus('Analyzing…')
    setStatusType('')

    try {
      const body = new FormData()
      if (file) body.append('file', file)
      if (pasteText.trim()) body.append('text', pasteText.trim())

      const res = await fetch('/api/autofill', { method: 'POST', body })
      if (!res.ok) throw new Error(await res.text())
      const extracted = await res.json()

      const updates: Partial<FormState> = {}
      const filled: string[] = []

      const maybe = (key: keyof FormState, label: string, val: string | null | undefined) => {
        if (!val) return
        (updates as Record<string, string>)[key] = val
        filled.push(label)
      }

      if (extracted.new_purchase) {
        updates.new_purchase = extracted.new_purchase
        filled.push('New Purchase')
      }
      if (extracted.occupancy) {
        updates.occupancy = extracted.occupancy
        filled.push('Occupancy')
      }
      maybe('prop_street', 'Property Street', extracted.prop_street)
      maybe('prop_city', 'Property City', extracted.prop_city)
      maybe('prop_state', 'Property State', extracted.prop_state)
      maybe('prop_zip', 'Property ZIP', extracted.prop_zip)
      maybe('mail_street', 'Mailing Street', extracted.mail_street)
      maybe('mail_city', 'Mailing City', extracted.mail_city)
      maybe('mail_state', 'Mailing State', extracted.mail_state)
      maybe('mail_zip', 'Mailing ZIP', extracted.mail_zip)
      maybe('sales_price', 'Sales Price', extracted.sales_price)
      maybe('loan_number', 'Loan Number', extracted.loan_number)
      maybe('mortgagee_name', 'Mortgagee', extracted.mortgagee)
      maybe('closing_date', 'Closing Date', extracted.closing_date)
      maybe('closing_contact', 'Closing Contact', extracted.closing_contact)
      maybe('year_built', 'Year Built', extracted.year_built)
      maybe('current_carrier', 'Current Carrier', extracted.current_carrier)
      maybe('premium', 'Premium', extracted.premium)

      // First insured
      if (extracted.first_name || extracted.last_name) {
        const updated = form.insureds.map((ins, idx) => {
          if (idx !== 0) return ins
          const next = { ...ins }
          if (extracted.first_name) { next.first = extracted.first_name; filled.push('First Name') }
          if (extracted.middle_name) { next.middle = extracted.middle_name; filled.push('Middle Name') }
          if (extracted.last_name) { next.last = extracted.last_name; filled.push('Last Name') }
          if (extracted.dob) { next.dob = extracted.dob; filled.push('Date of Birth') }
          if (extracted.ssn) { next.ssn = extracted.ssn; filled.push('SSN') }
          if (extracted.occupation) { next.occupation = extracted.occupation; filled.push('Occupation') }
          if (extracted.marital_status) { next.marital = extracted.marital_status; filled.push('Marital Status') }
          if (extracted.phone1) { next.phone = extracted.phone1; filled.push('Phone') }
          if (extracted.email1) { next.email = extracted.email1; filled.push('Email') }
          return next
        })
        updates.insureds = updated
      }

      update(updates)
      onFlash(Object.keys(updates))

      if (filled.length > 0) {
        setStatus(`Filled ${filled.length} field${filled.length > 1 ? 's' : ''}: ${filled.join(', ')}`)
        setStatusType('ok')
      } else {
        setStatus('No fields could be extracted. Check the document and try again.')
        setStatusType('err')
      }
    } catch (err: unknown) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStatusType('err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard
      number="⚡"
      title="Auto-Fill from Document or Email"
      className="print:hidden"
      accent="gold"
    >
      <div className="pt-3">
        <div className="flex gap-4 flex-wrap mb-4">
          {/* Drop zone */}
          <div className="flex-1 min-w-60">
            <label className="block text-[11px] font-semibold text-navy uppercase tracking-[0.03em] mb-1">Upload a Document (PDF, Image)</label>
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                file ? 'border-gold bg-amber-50' : 'border-gray-300 bg-gray-50 hover:border-gold'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
            >
              <div className="text-3xl mb-1">📄</div>
              <div className="text-xs text-gray-500">Click or drag &amp; drop<br /><span className="text-[11px]">PDF, JPG, PNG</span></div>
              {file && <div className="mt-2 text-xs text-navy font-semibold">{file.name}</div>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          <div className="flex items-center text-gray-400 font-bold text-sm px-2">— or —</div>

          {/* Paste area */}
          <div className="flex-[2] min-w-72">
            <label className="block text-[11px] font-semibold text-navy uppercase tracking-[0.03em] mb-1">Paste Email or Text</label>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={6}
              placeholder="Paste the email body or any text with client/property info here…"
              className="w-full rounded border border-[#d0cdc8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold resize-y"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runAutofill}
            disabled={loading || !autofillEnabled}
            className="bg-gold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded text-sm transition-colors"
          >
            {loading ? 'Analyzing…' : 'Auto-Fill Form'}
          </button>
          {!autofillEnabled && (
            <span className="text-sm text-gray-400 italic">Coming soon</span>
          )}
          {autofillEnabled && status && (
            <span className={`text-sm ${statusType === 'ok' ? 'text-green-700' : statusType === 'err' ? 'text-red-600' : 'text-gray-500'}`}>
              {status}
            </span>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
