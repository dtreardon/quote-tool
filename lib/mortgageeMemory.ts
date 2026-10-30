import type { FormState } from '@/app/types/form'

// Mortgagee clause fields remembered per referring company. Loan number is
// deliberately excluded — it is borrower-specific and must never be stored.
export const MORTGAGEE_MEMORY_KEYS = [
  'mortgagee_name', 'mortgagee_street', 'mortgagee_city', 'mortgagee_state', 'mortgagee_zip',
] as const satisfies readonly (keyof FormState)[]

export type MortgageeMemory = Record<(typeof MORTGAGEE_MEMORY_KEYS)[number], string>

// "First Coast Realty, Inc." / "first coast realty" / "First  Coast Realty LLC" → "first coast realty"
export function normalizeCompany(raw: string | null | undefined): string {
  let s = (raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  // Strip trailing entity suffixes, repeatedly ("co inc", "corp llc")
  let prev
  do {
    prev = s
    s = s.replace(/\s+(inc|llc|corp|co)$/, '').trim()
  } while (s !== prev)
  return s
}
