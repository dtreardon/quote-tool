'use client'

import { useState, useRef } from 'react'
import { SectionCard } from '../ui/SectionCard'
import { useAutoForm } from './AutoFormContext'
import { applyAutoExtractedData } from '@/lib/applyAutoAutofill'

interface AutoAutofillPanelProps {
  onAutofill: (fields: string[]) => void
  autofillEnabled?: boolean
}

export function AutoAutofillPanel({ onAutofill, autofillEnabled = false }: AutoAutofillPanelProps) {
  const { form, update } = useAutoForm()
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

      const { updates, flashKeys } = applyAutoExtractedData(x, form)

      if (Object.keys(updates).length === 0) {
        setStatus('No fields could be extracted. Check the document and try again.')
        setStatusType('err')
        return
      }

      update(updates)
      if (flashKeys.length > 0) onAutofill(flashKeys)

      setStatus(`Auto-filled ${flashKeys.length} field${flashKeys.length !== 1 ? 's' : ''}.`)
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
