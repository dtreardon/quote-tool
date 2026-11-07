'use client'

import { useState } from 'react'
import { useQuoteForm } from './QuoteFormContext'
import { Field, inputCls, selectCls } from '../ui/Field'
import { DollarInput } from '../ui/DollarInput'
import { StateSelect } from '../ui/StateSelect'
import type { BindData, FormState } from '@/app/types/form'
import { formatDate, parseMoney } from '@/lib/formatters'
import {
  bindKey, quotesKey, carrierOptions, selectedRow, selectCarrierPatch, billTo, expirationDate, parseMDY,
  invoiceFileName, type BindKind,
} from '@/lib/bind'
import { buildInvoiceHTML } from '@/lib/buildInvoiceHTML'

interface BindPanelProps {
  onClose: () => void
  // Renders HTML through /api/pdf and saves it to the sheet's save folder (or downloads)
  savePDF: (html: string, filename: string) => Promise<void>
  // Re-saves the quote sheet so its embedded qsp-data.json carries the bind data for Recall
  resaveSheet: (form: FormState) => Promise<void>
}

const LABELS: Record<BindKind, string> = { ho: 'Homeowners', flood: 'Flood' }

function Toggle<T extends string>({ value, options, onChange }: {
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded border border-[#d0cdc8] overflow-hidden">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-[7px] text-[13px] font-bold transition-colors ${
            value === v ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-[#f0ede8]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

async function fetchInvoiceNumber(): Promise<string> {
  let res: Response
  try {
    res = await fetch('/api/invoice-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: new Date().getFullYear() }),
    })
  } catch {
    throw new Error('Could not reach the invoice number service. Check your connection and try again.')
  }
  const data = await res.json().catch(() => null) as { invoiceNumber?: string; error?: string } | null
  if (!res.ok || !data?.invoiceNumber) {
    throw new Error(data?.error || `Invoice number service failed (HTTP ${res.status}).`)
  }
  return data.invoiceNumber
}

// What's missing before this policy can be invoiced
function problems(form: FormState, kind: BindKind): string[] {
  const b = form[bindKey(kind)]
  const out: string[] = []
  const row = selectedRow(form, kind)
  if (!row) out.push('carrier')
  else if (!((parseMoney(row.premium) ?? 0) > 0)) out.push('premium')
  if (!parseMDY(b.effective_date)) out.push('effective date (MM/DD/YYYY)')
  if (billTo(form, b) === 'mortgagee' && !form.mortgagee_name.trim()) out.push('mortgagee name (Bill To is Mortgagee)')
  return out
}

export function BindPanel({ onClose, savePDF, resaveSheet }: BindPanelProps) {
  const { form, update } = useQuoteForm()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const hasFlood  = form.flood_quote === 'yes'
  const isNew     = form.new_purchase === 'yes'
  const hoOptions = carrierOptions(form.quotes)
  // HO invoice only when Section 9 has a priced carrier (e.g. Mono Flood has none)
  const kinds: BindKind[] = [...(hoOptions.length ? ['ho' as const] : []), ...(hasFlood ? ['flood' as const] : [])]

  function setBind(kind: BindKind, patch: Partial<BindData>) {
    update({ [bindKey(kind)]: { ...form[bindKey(kind)], ...patch } })
  }

  // Closing date: effective dates that still follow it (blank or equal) follow the change
  function setClosingDate(v: string) {
    const patch: Partial<FormState> = { closing_date: v }
    for (const k of ['ho', 'flood'] as BindKind[]) {
      const b = form[bindKey(k)]
      if (!b.effective_date || b.effective_date === form.closing_date) patch[bindKey(k)] = { ...b, effective_date: v }
    }
    update(patch)
  }

  function setMortgagee(patch: Partial<FormState>) {
    update({ ...patch, mortgagee_open: true })
  }

  function setPremium(kind: BindKind, v: string) {
    const row = selectedRow(form, kind)
    if (!row) return
    update({ [quotesKey(kind)]: form[quotesKey(kind)].map(q => q.uid === row.uid ? { ...q, premium: v } : q) })
  }

  async function handleGenerate() {
    setError('')
    setDone('')
    if (!kinds.length) { setError('Nothing to invoice — add a carrier and premium in Section 9 or 10.'); return }
    const missing = kinds.flatMap(k => problems(form, k).map(p => `${LABELS[k]}: ${p}`))
    if (missing.length) { setError(`Missing ${missing.join('; ')}.`); return }

    setBusy(true)
    // Work on a local copy so every step sees the latest values; write back as we go
    let f: FormState = form
    try {
      // Invoice numbers are assigned once — reprints reuse the stored number.
      // Each new number is written to the sheet as soon as it is issued.
      for (const k of kinds) {
        const b = f[bindKey(k)]
        const invoice_number = b.invoice_number || await fetchInvoiceNumber()
        const next: BindData = { ...b, invoice_number, premium: selectedRow(f, k)!.premium }
        f = { ...f, [bindKey(k)]: next }
        update({ [bindKey(k)]: next })
      }
    } catch (err) {
      setError(`${err instanceof Error ? err.message : 'Invoice number failed.'} No invoice was created.`)
      setBusy(false)
      return
    }

    const saved: string[] = []
    try {
      const logoUrl = `${window.location.origin}/logo-white.png`
      for (const k of kinds) {
        const filename = invoiceFileName(f, k)
        await savePDF(buildInvoiceHTML(f, k, logoUrl, filename.replace(/\.pdf$/, '')), filename)
        saved.push(`${filename} (${f[bindKey(k)].invoice_number})`)
      }
    } catch (err) {
      setError(`Could not create the invoice PDF: ${err instanceof Error ? err.message : 'unknown error'}`)
      setBusy(false)
      return
    }

    const created = `Created ${saved.join(' and ')}.`
    setDone(`${created} Updating the quote sheet's Recall data…`)
    try {
      await resaveSheet(f)
      setDone(`${created} Quote sheet re-saved with the bind info.`)
    } catch {
      setDone(`${created} The quote sheet could not be re-saved — click Print / Save PDF to keep the bind info for Recall.`)
    } finally {
      setBusy(false)
    }
  }

  // Plain render helper (not a component) so inputs keep focus across re-renders
  function policySection(kind: BindKind) {
    const b       = form[bindKey(kind)]
    const options = carrierOptions(form[quotesKey(kind)])
    const row     = selectedRow(form, kind)
    const bt      = billTo(form, b)
    const exp     = expirationDate(b.effective_date)

    return (
      <div className="border border-[#d0cdc8] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-navy uppercase tracking-[0.05em]">{LABELS[kind]}</h3>
          {b.invoice_number && (
            <span className="text-[11px] text-gray-500" title="Reprints reuse this invoice number">
              Invoice {b.invoice_number}
            </span>
          )}
        </div>

        {!options.length ? (
          <p className="text-[12px] text-gray-400 italic">
            No {kind === 'ho' ? 'Section 9' : 'Section 10'} carrier has a premium yet.
          </p>
        ) : (
          <>
            <div className="flex gap-3 flex-wrap mb-3">
              <Field label="Carrier" className="flex-[3] min-w-48">
                <select
                  value={row?.uid ?? ''}
                  onChange={e => {
                    const r = options.find(q => q.uid === Number(e.target.value))
                    update(selectCarrierPatch(form, kind, r?.carrier ?? ''))
                  }}
                  className={selectCls()}
                >
                  <option value="">Select…</option>
                  {options.map(q => <option key={q.uid} value={q.uid}>{q.carrier}</option>)}
                </select>
              </Field>
              <Field label="Annual Premium" className="flex-[2] min-w-36">
                {row
                  ? <DollarInput value={row.premium} onChange={v => setPremium(kind, v)} />
                  : <input disabled className={`${inputCls()} bg-gray-50`} />}
              </Field>
            </div>

            <div className="flex gap-3 flex-wrap mb-3">
              {kind === 'ho' && isNew && (
                <Field label="Closing Date" className="w-32">
                  <input value={form.closing_date} onChange={e => setClosingDate(formatDate(e.target.value))} placeholder="MM/DD/YYYY" maxLength={10} className={inputCls()} />
                </Field>
              )}
              <Field label="Effective Date" className="w-32">
                <input value={b.effective_date} onChange={e => setBind(kind, { effective_date: formatDate(e.target.value) })} placeholder="MM/DD/YYYY" maxLength={10} className={inputCls()} />
              </Field>
              <Field label="Expiration Date" className="w-32">
                <input value={exp} readOnly tabIndex={-1} className={`${inputCls()} bg-gray-50 text-gray-500`} />
              </Field>
              <Field label="Policy Number" className="flex-1 min-w-44">
                <input
                  value={b.policy_number}
                  onChange={e => setBind(kind, { policy_number: e.target.value, policy_number_edited: e.target.value !== '' })}
                  placeholder={kind === 'flood' ? 'Enter flood policy #' : row ? 'No template — enter policy #' : ''}
                  className={inputCls()}
                />
              </Field>
            </div>

            <div className="flex gap-6 flex-wrap">
              <Field label="Bill To">
                <Toggle value={bt} options={[['mortgagee', 'Mortgagee'], ['insured', 'Insured']]} onChange={v => setBind(kind, { bill_to: v })} />
              </Field>
              <Field label="Status">
                <Toggle value={b.status} options={[['due', 'Due'], ['paid', 'Paid in Full']]} onChange={v => setBind(kind, { status: v })} />
              </Field>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 print:hidden" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col">
        <div className="px-6 pt-5 pb-3 border-b border-[#ede9e3] flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Bind</h2>
          <button onClick={onClose} disabled={busy} className="text-gray-400 hover:text-gray-600 text-xl leading-none disabled:opacity-40" aria-label="Close">✕</button>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-4">
          {/* Homeowners section shows even when empty so the agent sees why */}
          {policySection('ho')}

          {/* Mortgagee clause — shared by both invoices; edits go straight to Section 1 */}
          <div className="border border-[#d0cdc8] rounded-lg p-4">
            <h3 className="text-[13px] font-bold text-navy uppercase tracking-[0.05em] mb-3">Mortgagee Clause</h3>
            <div className="flex gap-3 flex-wrap mb-3">
              <Field label="Mortgagee Name" className="flex-1 min-w-60">
                <input value={form.mortgagee_name} onChange={e => setMortgagee({ mortgagee_name: e.target.value })} className={inputCls()} />
              </Field>
            </div>
            <div className="flex gap-3 flex-wrap mb-3">
              <Field label="Street" className="flex-[3] min-w-48">
                <input value={form.mortgagee_street} onChange={e => setMortgagee({ mortgagee_street: e.target.value })} className={inputCls()} />
              </Field>
              <Field label="City" className="flex-[2] min-w-32">
                <input value={form.mortgagee_city} onChange={e => setMortgagee({ mortgagee_city: e.target.value })} className={inputCls()} />
              </Field>
              <Field label="State" className="w-20">
                <StateSelect value={form.mortgagee_state} onChange={v => setMortgagee({ mortgagee_state: v })} />
              </Field>
              <Field label="ZIP" className="w-24">
                <input value={form.mortgagee_zip} onChange={e => setMortgagee({ mortgagee_zip: e.target.value })} maxLength={10} className={inputCls()} />
              </Field>
            </div>
            <Field label="Loan Number" className="w-52">
              <input value={form.loan_number} onChange={e => setMortgagee({ loan_number: e.target.value })} className={inputCls()} />
            </Field>
          </div>

          {hasFlood && policySection('flood')}
        </div>

        <div className="px-6 py-4 border-t border-[#ede9e3] space-y-3">
          {error && <div className="text-[13px] text-[#b42318] bg-[#fef3f2] border border-[#fecdca] rounded px-3 py-2">{error}</div>}
          {done && !error && <div className="text-[13px] text-[#1a7f37] bg-[#f0fdf4] border border-[#bbf7d0] rounded px-3 py-2">{done}</div>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} disabled={busy} className="border border-[#d0cdc8] rounded px-5 py-2.5 text-[13px] text-gray-600 hover:bg-[#f7f4ee] transition-colors disabled:opacity-40">
              Close
            </button>
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="bg-gold hover:bg-gold-light text-white px-5 py-2.5 rounded text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? 'Creating…' : 'Bind & Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
