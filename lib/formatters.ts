export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function formatSSN(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export function formatDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// ── Money ────────────────────────────────────────────────────────────────
// Dollar fields are stored as comma-formatted strings WITHOUT a "$" (the input
// shows "$" as an adornment and print adds it). parseMoney() turns any stored or
// typed value — "1500", "1,500", "$1500", "1500.5" — back into a number.

export function parseMoney(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const sanitized = String(value).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
  if (!sanitized || sanitized === '.') return null
  const n = Number(sanitized)
  return isFinite(n) ? n : null
}

export type MoneyFormat = 'cents' | 'whole'

// Premiums / sales price: "1,500.00". Coverage limits / deductibles: "86,000".
// Text with no digits (e.g. "TBD") is left as typed.
export function formatMoney(value: string | number | null | undefined, format: MoneyFormat): string {
  if (value == null) return ''
  const n = parseMoney(value)
  if (n === null) return String(value).trim()
  return format === 'cents'
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(n).toLocaleString('en-US')
}

export const formatCurrency      = (v: string | number | null | undefined) => formatMoney(v, 'cents')
export const formatWholeDollars  = (v: string | number | null | undefined) => formatMoney(v, 'whole')

// For print: "$1,500.00" / "$86,000"; blank stays blank, never "$$"
export function printMoney(value: string | null | undefined, format: MoneyFormat): string {
  if (!value) return ''
  const s = formatMoney(value, format)
  if (!s) return ''
  return parseMoney(value) === null ? s : `$${s}`
}

// Dwelling (Cov A) ÷ square footage, whole dollars: "$153 / sq ft".
// Derived only (never stored); '' when either value is blank or zero.
export function dwellingCostPerSqFt(dwelling: string, sqft: string): string {
  const d = parseMoney(dwelling)
  const s = parseMoney(sqft)
  if (!d || !s) return ''
  return `$${Math.round(d / s).toLocaleString('en-US')} / sq ft`
}

export function expandLiability(value: string): string {
  const v = value.trim()
  if (v === '1') return '100,000'
  if (v === '3') return '300,000'
  if (v === '5') return '500,000'
  if (v === '10') return '1,000,000'
  return formatWholeDollars(v)
}

export function expandMedPay(value: string): string {
  const v = value.trim()
  if (v === '1') return '1,000'
  if (v === '3') return '3,000'
  if (v === '5') return '5,000'
  if (v === '10') return '10,000'
  return formatWholeDollars(v)
}

export function formatEIN(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}
