'use client'

import { useState, useRef } from 'react'
import { SectionCard } from '../ui/SectionCard'
import { useQuoteForm } from './QuoteFormContext'
import type { FormState, InsuredData } from '@/app/types/form'

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

  async function runAutofill() {
    if (!file && !pasteText.trim()) {
      setStatus('Upload a file or paste text first.')
      setStatusType('err')
      return
    }

    setLoading(true)
    setStatus('')
    setStatusType('')

    try {
      const body = new FormData()
      if (file) body.append('file', file)
      if (pasteText.trim()) body.append('text', pasteText.trim())

      const res = await fetch('/api/autofill', { method: 'POST', body })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error || `HTTP ${res.status}`)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const x: Record<string, any> = await res.json()

      const updates: Partial<FormState> = {}
      const flashKeys: string[] = []

      // Only set if non-null — never overwrite a field with null (additive behavior)
      const set = (key: keyof FormState, val: string | null | undefined) => {
        if (val == null) return
        ;(updates as Record<string, string>)[key] = val
        flashKeys.push(key as string)
      }

      // Flat form fields
      set('prop_street',         x.subject_address)
      set('prop_city',           x.subject_city)
      set('prop_state',          x.subject_state)
      set('prop_zip',            x.subject_zip)
      set('mail_street',         x.mailing_address)
      set('prev_street',         x.previous_address)
      set('loan_number',         x.loan_number)
      set('occupancy',           x.occupancy)
      set('referred_by_name',    x.referred_by_name)
      set('referred_by_company', x.referred_by_company)
      set('mortgagee_name',      x.mortgagee_name)
      set('mortgagee_street',    x.mortgagee_street)
      set('mortgagee_city',      x.mortgagee_city)
      set('mortgagee_state',     x.mortgagee_state)
      set('mortgagee_zip',       x.mortgagee_zip)
      set('closing_date',        x.closing_date)
      set('sales_price',         x.sales_price != null ? String(x.sales_price) : null)

      // If a closing date was extracted, surface the purchase details section
      if (x.closing_date != null && !form.new_purchase) {
        updates.new_purchase = 'yes'
        flashKeys.push('new_purchase')
      }

      // Build updated insureds starting from current state
      let updatedInsureds = [...form.insureds]

      // Primary insured — patch index 0
      const primaryPatch: Partial<InsuredData> = {}
      if (x.primary_first     != null) primaryPatch.first  = x.primary_first
      if (x.primary_middle    != null) primaryPatch.middle = x.primary_middle
      if (x.primary_last      != null) primaryPatch.last   = x.primary_last
      if (x.primary_dob       != null) primaryPatch.dob    = x.primary_dob
      if (x.primary_ssn_last4 != null) primaryPatch.ssn    = x.primary_ssn_last4
      if (x.primary_phone     != null) primaryPatch.phone  = x.primary_phone
      if (x.primary_email     != null) primaryPatch.email  = x.primary_email
      if (Object.keys(primaryPatch).length > 0) {
        updatedInsureds = updatedInsureds.map((ins, idx) =>
          idx === 0 ? { ...ins, ...primaryPatch } : ins
        )
      }

      // Co-insureds — append new entries
      const coInsureds: Record<string, string | null>[] =
        Array.isArray(x.co_insureds) ? x.co_insureds : []
      if (coInsureds.length > 0) {
        const appended: InsuredData[] = coInsureds.map((ci, i) => ({
          uid:          Date.now() + i + 1,
          first:        ci.first        ?? '',
          middle:       ci.middle       ?? '',
          last:         ci.last         ?? '',
          suffix:       '',
          dob:          ci.dob          ?? '',
          ssn:          ci.ssn_last4    ?? '',
          marital:      '',
          occupation:   '',
          relationship: '',
          phone:        '',
          email:        '',
          showContact:  false,
        }))
        updatedInsureds = [...updatedInsureds, ...appended]
      }

      const insuredsChanged =
        JSON.stringify(updatedInsureds) !== JSON.stringify(form.insureds)
      if (insuredsChanged) updates.insureds = updatedInsureds

      if (Object.keys(updates).length === 0) {
        setStatus('No fields could be extracted. Check the document and try again.')
        setStatusType('err')
        return
      }

      update(updates)
      if (flashKeys.length > 0) onFlash(flashKeys)

      const n = flashKeys.length + (insuredsChanged ? 1 : 0)
      setStatus(`Auto-filled ${n} field${n !== 1 ? 's' : ''}.`)
      setStatusType('ok')
    } catch {
      setStatus('Auto-fill failed. Please fill in manually.')
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
            <label className="block text-[11px] font-semibold text-navy uppercase tracking-[0.03em] mb-1">
              Upload a Document (PDF, Image)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                file ? 'border-gold bg-amber-50' : 'border-gray-300 bg-gray-50 hover:border-gold'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) setFile(f)
              }}
            >
              <div className="text-3xl mb-1">📄</div>
              <div className="text-xs text-gray-500">
                Click or drag &amp; drop<br />
                <span className="text-[11px]">PDF, JPG, PNG · max 10 MB</span>
              </div>
              {file && <div className="mt-2 text-xs text-navy font-semibold">{file.name}</div>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
            />
          </div>

          <div className="flex items-center text-gray-400 font-bold text-sm px-2">— or —</div>

          {/* Paste area */}
          <div className="flex-[2] min-w-72">
            <label className="block text-[11px] font-semibold text-navy uppercase tracking-[0.03em] mb-1">
              Paste Email or Text
            </label>
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
            className="inline-flex items-center gap-2 bg-gold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded text-sm transition-colors"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Analyzing…' : 'Auto-Fill Form'}
          </button>
          {!autofillEnabled && (
            <span className="text-sm text-gray-400 italic">Coming soon</span>
          )}
          {autofillEnabled && status && (
            <span className={`text-sm ${
              statusType === 'ok'  ? 'text-green-700' :
              statusType === 'err' ? 'text-red-600'   : 'text-gray-500'
            }`}>
              {status}
            </span>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
