'use client'

import { useState } from 'react'

interface FileNameInputProps {
  // Agent's own name for this sheet ('' = follow the auto-generated name)
  value: string
  autoName: string
  onChange: (v: string) => void
}

// Editable saved-PDF name in the bottom bar. Screen only — never printed.
// Shows the auto-generated name (updating live) until the agent types their own;
// leaving the box empty returns to the auto name. ".pdf" is added on save.
export function FileNameInput({ value, autoName, onChange }: FileNameInputProps) {
  // While focused the agent edits a local draft, so the box can be emptied and
  // retyped without snapping back to the auto name mid-edit.
  const [draft, setDraft] = useState<string | null>(null)
  const shown = value || autoName

  return (
    <label className="flex flex-col gap-0.5 print:hidden">
      <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-white/50">
        File Name{value ? '' : ' (auto)'}
      </span>
      <input
        value={draft ?? shown}
        onFocus={() => setDraft(shown)}
        onChange={e => {
          setDraft(e.target.value)
          const v = e.target.value.trim()
          onChange(v === autoName ? '' : v)
        }}
        onBlur={() => setDraft(null)}
        spellCheck={false}
        title={`Saved as: ${shown}.pdf`}
        className="w-[clamp(180px,26vw,380px)] rounded border border-white/30 bg-white/10 text-white text-[12px] px-2 py-[5px] focus:outline-none focus:ring-2 focus:ring-gold"
      />
    </label>
  )
}
