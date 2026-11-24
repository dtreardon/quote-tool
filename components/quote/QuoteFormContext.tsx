'use client'
import { createContext, useContext } from 'react'
import type { FormState } from '@/app/types/form'
import type { CompanyClause, LibraryClause } from '@/lib/mortgageeMemory'

// A clause chip under the Mortgagee Clause heading (ck: the company it belongs to)
export type MortgageeChip = CompanyClause & { ck: string }

interface QuoteFormContextType {
  form: FormState
  update: (partial: Partial<FormState>) => void
  updateIfEmpty: (partial: Partial<FormState>) => void
  autofilledFields: Set<string>
  markAutofilled: (fields: string[]) => void
  clearAutofilled: (fields: string[]) => void
  // Mortgagee memory for this referring company: fills an empty clause, shows clause
  // chips. `pending`: updates just applied by the caller (auto-fill).
  lookupMortgagee: (company: string, pending?: Partial<FormState>) => void
  // Internal HO sheet id (never shown or printed) — sent with the save so memory counts a sheet once
  getSheetId: () => string
  // Clause chips for the current company (2+ clauses), most used first. Screen only.
  mortgageeChips: MortgageeChip[]
  // Whole clause library for the Mortgagee Name typeahead, most used first
  mortgageeLibrary: LibraryClause[]
  // Replaces name, street, city, state and ZIP (never the loan number)
  applyMortgageeClause: (c: { name: string; street: string; city: string; state: string; zip: string }) => void
}

export const QuoteFormContext = createContext<QuoteFormContextType | null>(null)

export function useQuoteForm() {
  const ctx = useContext(QuoteFormContext)
  if (!ctx) throw new Error('useQuoteForm must be used within QuoteFormProvider')
  return ctx
}
