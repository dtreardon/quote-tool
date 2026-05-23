'use client'
import { useState, useCallback } from 'react'
import { QuoteFormContext } from './QuoteFormContext'
import { INITIAL_FORM } from '@/app/types/form'
import type { FormState } from '@/app/types/form'
import { Banner } from './Banner'
import { NotesSection } from './NotesSection'
import { AutofillPanel } from './AutofillPanel'
import { Section1 } from './Section1'
import { Section2 } from './Section2'
import { Section3 } from './Section3'
import { Section4 } from './Section4'
import { Section5 } from './Section5'
import { Section6 } from './Section6'
import { Section7 } from './Section7'
import { Section8 } from './Section8'
import { Section9 } from './Section9'
import { Section10 } from './Section10'
import { ActionBar } from './ActionBar'

export default function QuoteForm({ autofillEnabled = false }: { autofillEnabled?: boolean }) {
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM, insureds: [{ ...INITIAL_FORM.insureds[0] }] })
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set())

  const update = useCallback((partial: Partial<FormState>) => {
    setForm(prev => {
      const next = { ...prev, ...partial }
      if (partial.year_built && !prev.reno_roof && !('reno_roof' in partial)) {
        next.reno_roof = partial.year_built
      }
      return next
    })
    setAutofilledFields(prev => {
      const keys = Object.keys(partial)
      if (!keys.some(k => prev.has(k))) return prev
      const next = new Set(prev)
      keys.forEach(k => next.delete(k))
      return next
    })
  }, [])

  const markAutofilled = useCallback((fields: string[]) => {
    setAutofilledFields(prev => new Set([...prev, ...fields]))
  }, [])

  function clearForm() {
    if (!window.confirm('Clear all fields and start over?')) return
    setForm({ ...INITIAL_FORM, insureds: [{ ...INITIAL_FORM.insureds[0] }] })
    setAutofilledFields(new Set())
  }

  return (
    <QuoteFormContext.Provider value={{ form, update, autofilledFields, markAutofilled }}>
      <div className="max-w-[980px] mx-auto px-4 pt-7 pb-20">
        <AutofillPanel onAutofill={markAutofilled} autofillEnabled={autofillEnabled} />
        <Banner />
        <NotesSection />
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
        <Section6 />
        <Section7 />
        <Section8 />
        <Section9 />
        {form.flood_quote === 'yes' && <Section10 />}
      </div>
      <ActionBar onClear={clearForm} />
    </QuoteFormContext.Provider>
  )
}
