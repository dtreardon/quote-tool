import type { BindData, FormState, QuoteData } from '@/app/types/form'
import { policyNumberTemplateFor } from './carrierEngine'
import { buildPolicyNumber, policyFormToken } from './policyNumber'
import { parseMoney } from './formatters'
import { saveFileName } from './fileName'

// Invoice panel helpers (HO sheet). Data keys keep the original "bind" names. Everything here is derived from the sheet so the
// sheet, the invoice and the future ACORD 27 always agree.

export type BindKind = 'ho' | 'flood'

export const bindKey = (kind: BindKind) => (kind === 'ho' ? 'bind_ho' : 'bind_flood') as 'bind_ho' | 'bind_flood'
export const quotesKey = (kind: BindKind) => (kind === 'ho' ? 'quotes' : 'flood_quotes') as 'quotes' | 'flood_quotes'

// Carrier choices: quote rows with a carrier name and a premium
export function carrierOptions(rows: QuoteData[]): QuoteData[] {
  return rows.filter(q => q.carrier.trim() && (parseMoney(q.premium) ?? 0) > 0)
}

export function selectedRow(form: FormState, kind: BindKind): QuoteData | undefined {
  const name = form[bindKey(kind)].carrier
  return name ? carrierOptions(form[quotesKey(kind)]).find(q => q.carrier === name) : undefined
}

// HO policy number from the carrier's template at the agent's local time now.
// Flood numbers are always typed by the agent.
export function generatePolicyNumber(form: FormState, kind: BindKind, carrier: string): string {
  if (kind === 'flood') return ''
  return buildPolicyNumber(policyNumberTemplateFor(carrier), {
    date: new Date(),
    form: policyFormToken(form.policy_type),
    state: form.prop_state,
  })
}

// Locked once an invoice has been created: the stored policy number is kept as issued
export const isLocked = (b: BindData) => !!b.invoice_number

// Patch for selecting a carrier: policy number regenerates unless the agent typed in
// it or an invoice already locked it
export function selectCarrierPatch(form: FormState, kind: BindKind, carrier: string): Partial<FormState> {
  const b = form[bindKey(kind)]
  if (b.carrier === carrier) return {}
  const next: BindData = { ...b, carrier }
  if (!b.policy_number_edited && !isLocked(b)) next.policy_number = generatePolicyNumber(form, kind, carrier)
  return { [bindKey(kind)]: next }
}

// "Regenerate" on a locked policy number (wrong carrier picked): new number from the
// current carrier's template at the time of the click. Invoice number never changes.
export function regeneratePolicyNumberPatch(form: FormState, kind: BindKind): Partial<FormState> {
  const b = form[bindKey(kind)]
  return { [bindKey(kind)]: { ...b, policy_number: generatePolicyNumber(form, kind, b.carrier), policy_number_edited: false } }
}

export const hasPolicyTemplate = (kind: BindKind, carrier: string) =>
  kind === 'ho' && !!policyNumberTemplateFor(carrier)

// Prefill when the panel opens: preselect a lone carrier row, default the effective
// date to the closing date on new purchases. Existing bind values are kept.
export function openBindPatch(form: FormState): Partial<FormState> {
  let f = form
  const kinds: BindKind[] = form.flood_quote === 'yes' ? ['ho', 'flood'] : ['ho']
  for (const kind of kinds) {
    const opts = carrierOptions(f[quotesKey(kind)])
    if (!selectedRow(f, kind) && opts.length === 1) {
      f = { ...f, ...selectCarrierPatch(f, kind, opts[0].carrier) }
    }
    const b = f[bindKey(kind)]
    if (!b.effective_date && f.new_purchase === 'yes' && f.closing_date) {
      f = { ...f, [bindKey(kind)]: { ...b, effective_date: f.closing_date } }
    }
  }
  const patch: Partial<FormState> = {}
  if (f.bind_ho !== form.bind_ho) patch.bind_ho = f.bind_ho
  if (f.bind_flood !== form.bind_flood) patch.bind_flood = f.bind_flood
  return patch
}

// Closing date change: effective dates still following it (blank or equal to the
// old closing date) follow along; one the agent typed differently is kept.
export function closingDatePatch(form: FormState, closing_date: string): Partial<FormState> {
  const patch: Partial<FormState> = { closing_date }
  for (const key of ['bind_ho', 'bind_flood'] as const) {
    const b = form[key]
    if (!b.effective_date || b.effective_date === form.closing_date) patch[key] = { ...b, effective_date: closing_date }
  }
  return patch
}

// ── Dates ────────────────────────────────────────────────────────────────

export function parseMDY(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(+m[3], +m[1] - 1, +m[2])
  return d.getMonth() === +m[1] - 1 && d.getDate() === +m[2] ? d : null
}

export function formatMDY(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

// Same month/day next year; Feb 29 → Feb 28
export function expirationDate(effective: string): string {
  const d = parseMDY(effective)
  if (!d) return ''
  const exp = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
  if (exp.getMonth() !== d.getMonth()) exp.setDate(0)
  return formatMDY(exp)
}

// ── Names / addresses for the invoice ───────────────────────────────────

export function insuredNames(form: FormState): string {
  return form.insureds
    .map(i => i.insuredType === 'entity'
      ? i.entityName.trim()
      : [i.first, i.middle, i.last, i.suffix].map(s => s.trim()).filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' & ')
}

export interface Address { street: string; cityStateZip: string }

const cityStateZip = (city: string, state: string, zip: string) =>
  [city.trim(), [state.trim(), zip.trim()].filter(Boolean).join(' ')].filter(Boolean).join(', ')

export function propertyAddress(form: FormState): Address {
  return { street: form.prop_street.trim(), cityStateZip: cityStateZip(form.prop_city, form.prop_state, form.prop_zip) }
}

// Phone of the first insured that has one ('' when none)
export const insuredPhone = (form: FormState) => form.insureds.find(i => i.phone.trim())?.phone.trim() ?? ''

// Mailing address, or the subject property when mailing is "same as subject" / blank
export function mailingAddress(form: FormState): Address {
  if (form.mail_same_as_subject || !form.mail_street.trim()) return propertyAddress(form)
  return { street: form.mail_street.trim(), cityStateZip: cityStateZip(form.mail_city, form.mail_state, form.mail_zip) }
}

export function mortgageeAddress(form: FormState): Address {
  return { street: form.mortgagee_street.trim(), cityStateZip: cityStateZip(form.mortgagee_city, form.mortgagee_state, form.mortgagee_zip) }
}

const TITLES: Record<string, string> = {
  HO: 'HOMEOWNERS', DP: 'DWELLING', Condo: 'CONDO', Renters: 'RENTERS', MH: 'MOBILE HOME',
}

export function invoiceTitle(form: FormState, kind: BindKind): string {
  return `${kind === 'flood' ? 'FLOOD' : (TITLES[form.policy_type] ?? 'HOMEOWNERS')} POLICY INVOICE`
}

// ── File names ───────────────────────────────────────────────────────────

const FORM_CODES: Record<string, string> = { HO: 'HO3', DP: 'DP3', Condo: 'HO6', Renters: 'HO4', MH: 'MH' }

export function invoiceFileName(form: FormState, kind: BindKind): string {
  const primary = form.insureds[0]
  const who = primary?.insuredType === 'entity'
    ? (primary.entityName || '').toUpperCase()
    : `${(primary?.last || '').toUpperCase()}, ${(primary?.first || '').toUpperCase()}`
  const code = kind === 'flood' ? 'FLOOD' : (FORM_CODES[form.policy_type] ?? 'HO3')
  const base = `${who} ${code} INVOICE ${form.prop_street || ''}`
    .replace(/^\s*,\s*/, '').replace(/\s+/g, ' ').trim()
  return saveFileName(undefined, base)
}
