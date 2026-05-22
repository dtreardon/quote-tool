'use client'

import { createContext, useContext } from 'react'
import type { FormState } from '@/app/types/form'

interface QuoteFormContextType {
  form: FormState
  update: (partial: Partial<FormState>) => void
  flashFields: Set<string>
  flash: (fields: string[]) => void
}

export const QuoteFormContext = createContext<QuoteFormContextType | null>(null)

export function useQuoteForm() {
  const ctx = useContext(QuoteFormContext)
  if (!ctx) throw new Error('useQuoteForm must be used within QuoteFormProvider')
  return ctx
}
