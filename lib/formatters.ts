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

export function formatDollar(value: string): string {
  // Strip everything except digits and the first decimal point
  const sanitized = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
  if (!sanitized || sanitized === '.') return ''
  const [intPart, decPart] = sanitized.split('.')
  const formatted = Number(intPart || '0').toLocaleString()
  return decPart !== undefined && decPart !== '' ? `${formatted}.${decPart}` : formatted
}

export function expandLiability(value: string): string {
  const v = value.trim()
  if (v === '1') return '100,000'
  if (v === '3') return '300,000'
  if (v === '5') return '500,000'
  if (v === '10') return '1,000,000'
  return formatDollar(v)
}

export function expandMedPay(value: string): string {
  const v = value.trim()
  if (v === '1') return '1,000'
  if (v === '3') return '3,000'
  if (v === '5') return '5,000'
  if (v === '10') return '10,000'
  return formatDollar(v)
}
