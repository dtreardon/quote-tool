'use client'
import { createContext, useContext } from 'react'
import type { AutoFormState } from '@/app/types/autoForm'

interface AutoFormContextType {
  form: AutoFormState
  update: (partial: Partial<AutoFormState>) => void
  autofilledFields: Set<string>
  markAutofilled: (fields: string[]) => void
  clearAutofilled: (fields: string[]) => void
}

export const AutoFormContext = createContext<AutoFormContextType | null>(null)

export function useAutoForm() {
  const ctx = useContext(AutoFormContext)
  if (!ctx) throw new Error('useAutoForm must be used within AutoFormContext.Provider')
  return ctx
}
