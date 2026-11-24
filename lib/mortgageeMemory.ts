import type { FormState } from '@/app/types/form'

// Mortgagee clause fields remembered per referring company. Loan number is
// deliberately excluded — it is borrower-specific and must never be stored.
export const MORTGAGEE_MEMORY_KEYS = [
  'mortgagee_name', 'mortgagee_street', 'mortgagee_city', 'mortgagee_state', 'mortgagee_zip',
] as const satisfies readonly (keyof FormState)[]

export type MortgageeMemory = Record<(typeof MORTGAGEE_MEMORY_KEYS)[number], string>

// LEGACY company normalization — the key of the old one-clause-per-company entries
// (mortgagee:{normalizeCompany(company)}). Kept unchanged so those entries can still be read.
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

// ─── Clause library (mm:* keys) ─────────────────────────────────────────────
// These helpers are used only for memory matching. They never change how a form
// field is stored, displayed or printed.

// A clause as the library stores it (display values = most recently saved spelling)
export interface ClauseRecord {
  name: string
  street: string
  city: string
  state: string
  zip: string
  uses: number
  lastUsed: number // epoch ms
}

// A clause linked to a referring company, as returned by a company lookup
export interface CompanyClause {
  id: string
  name: string
  street: string
  city: string
  state: string
  zip: string
  count: number
  lastUsed: number
}

// A clause in the library list (typeahead)
export interface LibraryClause {
  id: string
  name: string
  street: string
  city: string
  state: string
  zip: string
  uses: number
  lastUsed: number
}

const COMPANY_SUFFIXES = new Set(['llc', 'inc', 'corp', 'corporation', 'co', 'company', 'ltd', 'lp', 'the'])

// Periods and apostrophes vanish ("U.S." → "us", "O'Neil" → "oneil"); any other
// punctuation separates words ("ISAOA/ATIMA" → "isaoa atima").
function words(raw: string | null | undefined): string[] {
  return (raw ?? '')
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

// "The First Coast Realty Co., Inc." → "first coast realty"
export function companyKey(raw: string | null | undefined): string {
  return words(raw).filter(w => !COMPANY_SUFFIXES.has(w)).join(' ')
}

// "Wells Fargo Bank, N.A. ISAOA/ATIMA" → "wells fargo bank na"
export function matchName(raw: string | null | undefined): string {
  return ` ${words(raw).join(' ')} `
    .replace(/ its successors (and or |and |or )?assigns /g, ' ')
    .split(' ')
    .filter(w => w && w !== 'isaoa' && w !== 'atima')
    .join(' ')
}

const STREET_WORDS: Record<string, string> = {
  street: 'st', avenue: 'ave', road: 'rd', drive: 'dr', suite: 'ste',
}

// "P.O. Box 5000, Suite 200" / "Post Office Box 5000 Ste 200" → "po box 5000 ste 200"
export function matchStreet(raw: string | null | undefined): string {
  return ` ${words(raw).map(w => STREET_WORDS[w] ?? w).join(' ')} `
    .replace(/ post office box /g, ' po box ')
    .replace(/ p o box /g, ' po box ')
    .trim()
}

export function matchZip(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '').slice(0, 5)
}

// cyrb53 — small deterministic string hash, identical on server and client
function hash53(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

// Same lender clause regardless of spelling: normalized name + street + 5-digit ZIP
export function clauseId(c: { name: string; street: string; zip: string }): string {
  return hash53(`${matchName(c.name)}|${matchStreet(c.street)}|${matchZip(c.zip)}`).toString(36)
}

export function clauseIdOfForm(f: Pick<FormState, 'mortgagee_name' | 'mortgagee_street' | 'mortgagee_zip'>): string {
  return clauseId({ name: f.mortgagee_name, street: f.mortgagee_street, zip: f.mortgagee_zip })
}

// Form fields for a clause (loan number is never part of a clause)
export function clauseToForm(c: { name: string; street: string; city: string; state: string; zip: string }): MortgageeMemory {
  return {
    mortgagee_name: c.name, mortgagee_street: c.street, mortgagee_city: c.city,
    mortgagee_state: c.state, mortgagee_zip: c.zip,
  }
}

export const byCountThenRecent = (a: CompanyClause, b: CompanyClause) =>
  b.count - a.count || b.lastUsed - a.lastUsed
export const byUsesThenRecent = (a: LibraryClause, b: LibraryClause) =>
  b.uses - a.uses || b.lastUsed - a.lastUsed
