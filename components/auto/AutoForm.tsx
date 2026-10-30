'use client'

import { Fragment, useState, useCallback, useEffect, useRef } from 'react'
import { AutoFormContext } from './AutoFormContext'
import { INITIAL_AUTO_FORM, INITIAL_DRIVER, INITIAL_VEHICLE } from '@/app/types/autoForm'
import type { AutoFormState } from '@/app/types/autoForm'
import { loadSavedAgent } from '@/lib/agentMemory'
import { restoreAutoForm } from '@/lib/restoreSheet'
import type { SheetPayload } from '@/lib/sheetData'
import { RecallButton, takeRecallHandoff } from '../ui/RecallButton'
import { AutoAutofillPanel } from './AutoAutofillPanel'
import { AutoNotes } from './AutoNotes'
import { Section1 } from './Section1'
import { Section2 } from './Section2'
import { Section3 } from './Section3'
import { Section4 } from './Section4'
import { Section5 } from './Section5'
import { Section6 } from './Section6'
import { Section7 } from './Section7'
import { AutoActionBar } from './AutoActionBar'

function makeInitialForm(): AutoFormState {
  return {
    ...INITIAL_AUTO_FORM,
    drivers:  [{ ...INITIAL_DRIVER }],
    vehicles: [{ ...INITIAL_VEHICLE }],
  }
}

export default function AutoForm({ autofillEnabled = false }: { autofillEnabled?: boolean }) {
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

  // Recall: replaces the whole sheet with a saved one. Sections are remounted
  // (keyed on restoreCount) so no local state carries over; no check circles.
  const formRef = useRef(form)
  useEffect(() => { formRef.current = form }, [form])
  const [restoreCount, setRestoreCount] = useState(0)
  const restoreSheet = useCallback((payload: SheetPayload) => {
    setForm(restoreAutoForm(payload.form as Partial<AutoFormState>))
    setAutofilledFields(new Set())
    setRestoreCount(n => n + 1)
  }, [])
  const isDirty = useCallback(() =>
    JSON.stringify(formRef.current) !== JSON.stringify({ ...makeInitialForm(), agent: formRef.current.agent }),
  [])

  // New blank sheet — default the Agent to the last one picked on this browser,
  // then apply data copied from the HO form via sessionStorage (its agent wins if set)
  useEffect(() => {
    const saved = loadSavedAgent()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage after hydration
    if (saved) setForm(prev => prev.agent ? prev : { ...prev, agent: saved })

    // Auto sheet recalled from the HO sheet's Recall button
    const handoff = takeRecallHandoff('Auto')
    if (handoff) { restoreSheet(handoff); return }

    try {
      const raw = sessionStorage.getItem('copiedData')
      if (!raw) return
      sessionStorage.removeItem('copiedData')
      const data = JSON.parse(raw) as Partial<AutoFormState>
      if (!data.agent) delete data.agent
      setForm(prev => ({ ...prev, ...data }))
    } catch { /* ignore */ }
  }, [restoreSheet])

  function clearForm() {
    if (!window.confirm('Clear all fields and start over?')) return
    setForm({ ...makeInitialForm(), agent: loadSavedAgent() })
    setAutofilledFields(new Set())
  }

  return (
    <AutoFormContext.Provider value={{ form, update, autofilledFields, markAutofilled, clearAutofilled }}>
      <div className="max-w-[980px] mx-auto px-4 pt-7 pb-20">
        <AutoAutofillPanel
          onAutofill={markAutofilled}
          autofillEnabled={autofillEnabled}
          recall={<RecallButton sheet="Auto" isDirty={isDirty} onRestore={restoreSheet} />}
        />
        <Fragment key={restoreCount}>
        <AutoNotes />
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
        <Section6 />
        <Section7 />
        </Fragment>
      </div>
      <AutoActionBar onClear={clearForm} />
    </AutoFormContext.Provider>
  )
}
