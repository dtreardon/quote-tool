'use client'

import { useQuoteForm } from './QuoteFormContext'
import { SectionCard } from '../ui/SectionCard'

export function NotesSection() {
  const { form, update } = useQuoteForm()
  return (
    <SectionCard title="Notes" className="print:hidden">
      <textarea
        value={form.notes}
        onChange={e => update({ notes: e.target.value })}
        rows={3}
        placeholder="Add notes here — appears in the print header..."
        className="w-full rounded border border-[#d0cdc8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold resize-y"
      />
    </SectionCard>
  )
}
