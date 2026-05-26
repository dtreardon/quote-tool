'use client'

import { useState, useCallback, useEffect } from 'react'
import { AutoFormContext } from './AutoFormContext'
import { INITIAL_AUTO_FORM } from '@/app/types/autoForm'
import type { AutoFormState } from '@/app/types/autoForm'
import { AutoBanner } from './AutoBanner'
import { AutoNotes } from './AutoNotes'
import { Section1 } from './Section1'
import { Section2 } from './Section2'
import { Section3 } from './Section3'
import { Section4 } from './Section4'
import { Section5 } from './Section5'
import { Section6 } from './Section6'
import { Section7 } from './Section7'
import { Section8 } from './Section8'
import { AutoActionBar } from './AutoActionBar'

function makeInitialForm(): AutoFormState {
  return {
    ...INITIAL_AUTO_FORM,
    insureds: [{ ...INITIAL_AUTO_FORM.insureds[0] }],
    vehicles: [{ ...INITIAL_AUTO_FORM.vehicles[0] }],
    drivers: [{ ...INITIAL_AUTO_FORM.drivers[0] }],
  }
}

export default function AutoForm() {
  const [form, setForm] = useState<AutoFormState>(makeInitialForm)
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set())

  const update = useCallback((partial: Partial<AutoFormState>) => {
    setForm(prev => ({ ...prev, ...partial }))
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

  const clearAutofilled = useCallback((fields: string[]) => {
    setAutofilledFields(prev => {
      if (!fields.some(f => prev.has(f))) return prev
      const next = new Set(prev)
      fields.forEach(f => next.delete(f))
      return next
    })
  }, [])

  // Apply data copied from the HO form via sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('copiedData')
      if (!raw) return
      sessionStorage.removeItem('copiedData')
      const data = JSON.parse(raw) as Partial<AutoFormState>
      setForm(prev => ({ ...prev, ...data }))
    } catch { /* ignore */ }
  }, [])

  function clearForm() {
    if (!window.confirm('Clear all fields and start over?')) return
    setForm(makeInitialForm())
    setAutofilledFields(new Set())
  }

  return (
    <AutoFormContext.Provider value={{ form, update, autofilledFields, markAutofilled, clearAutofilled }}>
      <div className="max-w-[980px] mx-auto px-4 pt-7 pb-20">
        <AutoBanner />
        <AutoNotes />
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
        <Section6 />
        <Section7 />
        <Section8 />
      </div>
      <AutoActionBar onClear={clearForm} />
    </AutoFormContext.Provider>
  )
}
