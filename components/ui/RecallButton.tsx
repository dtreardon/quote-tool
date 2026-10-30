'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  readSheetData, RECALL_HANDOFF_KEY, SHEET_DATA_SCHEMA, SHEET_PATHS,
  type SheetPayload, type SheetType,
} from '@/lib/sheetData'

const SHEET_NAMES: Record<SheetType, string> = { HO: 'Homeowners', Auto: 'Auto' }

interface RecallButtonProps {
  sheet: SheetType
  // True when the current sheet has anything entered (asks before replacing it)
  isDirty: () => boolean
  onRestore: (payload: SheetPayload) => void
}

export function RecallButton({ sheet, isDirty, onRestore }: RecallButtonProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')

  const show = (text: string, type: 'ok' | 'err') => { setMsg(text); setMsgType(type) }

  async function handleFile(file: File) {
    setBusy(true)
    setMsg('')
    try {
      const result = await readSheetData(file)
      if (result.status === 'unreadable') {
        show("That file couldn't be opened as a PDF.", 'err')
        return
      }
      if (result.status === 'no-data') {
        show("This sheet was saved before Recall was added and can't be restored. Try running it through Auto-Fill instead.", 'err')
        return
      }

      const { payload } = result
      if (payload.schema > SHEET_DATA_SCHEMA) {
        show('This sheet was saved by a newer version of QuoteSheetPRO. Reload the page and try again.', 'err')
        return
      }

      if (payload.sheet !== sheet) {
        const target = SHEET_NAMES[payload.sheet]
        const ok = !isDirty() || window.confirm(
          `This is a saved ${target} quote sheet. Open it on the ${target} sheet?\n\nAnything entered on this ${SHEET_NAMES[sheet]} sheet will be lost.`
        )
        if (!ok) return
        try {
          sessionStorage.setItem(RECALL_HANDOFF_KEY, JSON.stringify(payload))
        } catch {
          show(`This is a saved ${target} sheet. Open the ${target} sheet and use Recall there.`, 'err')
          return
        }
        router.push(SHEET_PATHS[payload.sheet])
        return
      }

      if (isDirty() && !window.confirm('Replace everything on this sheet with the recalled sheet?')) return

      onRestore(payload)
      const saved = new Date(payload.savedAt)
      show(`Recalled ${file.name}${isNaN(saved.getTime()) ? '' : ` (saved ${saved.toLocaleDateString('en-US')})`}.`, 'ok')
    } catch {
      show("Couldn't recall that sheet.", 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Load a sheet previously saved with Print / Save PDF"
        className="inline-flex items-center gap-1.5 border border-navy text-navy font-bold px-4 py-2 rounded text-sm hover:bg-[#f0ede8] disabled:opacity-40 transition-colors"
      >
        ↺ {busy ? 'Recalling…' : 'Recall Saved Sheet'}
      </button>
      {/* Same mechanism as the Auto-Fill upload so the browser reuses the last folder picked */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          e.target.value = '' // allow re-picking the same file
          if (f) handleFile(f)
        }}
      />
      {msg && (
        <span className={`text-sm ${msgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{msg}</span>
      )}
    </div>
  )
}

// On page load, pick up a sheet handed off from the other sheet's Recall button.
export function takeRecallHandoff(sheet: SheetType): SheetPayload | null {
  try {
    const raw = sessionStorage.getItem(RECALL_HANDOFF_KEY)
    if (!raw) return null
    const payload = JSON.parse(raw) as SheetPayload
    if (payload.sheet !== sheet) return null
    sessionStorage.removeItem(RECALL_HANDOFF_KEY)
    return payload
  } catch {
    return null
  }
}
