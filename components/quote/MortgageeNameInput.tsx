'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { matchName, type LibraryClause } from '@/lib/mortgageeMemory'

const MAX_SUGGESTIONS = 8

interface MortgageeNameInputProps {
  value: string
  onChange: (v: string) => void
  onPick: (c: LibraryClause) => void
  library: LibraryClause[]
  className: string
  placeholder?: string
}

// Mortgagee Name with a typeahead over the agency's clause library (any company).
// Opens only while typing (2+ characters). Arrow keys + Enter pick, Escape closes,
// Tab leaves the field without picking. The list is portaled to <body> with fixed
// positioning so no card clips it and the page layout is untouched. Screen only.
export function MortgageeNameInput({ value, onChange, onPick, library, className, placeholder }: MortgageeNameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null)

  const matches = useMemo(() => {
    const raw = value.trim().toLowerCase()
    if (raw.length < 2 || !library.length) return []
    const q = matchName(value)
    // Library is already sorted by uses, then recency
    return library
      .filter(c => c.name.toLowerCase().includes(raw) || (q && matchName(c.name).includes(q)))
      .slice(0, MAX_SUGGESTIONS)
  }, [value, library])

  const show = open && matches.length > 0

  // Keep the list under the input while the page or the panel scrolls
  useLayoutEffect(() => {
    if (!show) return
    const place = () => {
      const r = inputRef.current?.getBoundingClientRect()
      if (r) setRect({ left: r.left, top: r.bottom + 2, width: Math.max(r.width, 320) })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [show])

  useEffect(() => {
    if (active >= matches.length) setActive(-1) // eslint-disable-line react-hooks/set-state-in-effect -- keep highlight in range as matches shrink
  }, [active, matches.length])

  function pick(c: LibraryClause) {
    setOpen(false)
    setActive(-1)
    onPick(c)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!show) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => (i + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i <= 0 ? matches.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      if (active >= 0 && matches[active]) {
        e.preventDefault()
        pick(matches[active])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setActive(-1)
    } else if (e.key === 'Tab') {
      setOpen(false) // leave the field normally, nothing picked
      setActive(-1)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1) }}
        onKeyDown={onKeyDown}
        onBlur={() => { setOpen(false); setActive(-1) }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        className={className}
      />
      {show && rect && createPortal(
        <ul
          id={listId}
          role="listbox"
          className="fixed z-[60] max-h-72 overflow-y-auto rounded border border-[#d0cdc8] bg-white py-1 shadow-lg print:hidden"
          style={{ left: rect.left, top: rect.top, width: rect.width }}
        >
          {matches.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input keeps focus and blur doesn't close the list first
              onMouseDown={e => { e.preventDefault(); pick(c) }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-2.5 py-1.5 text-sm ${i === active ? 'bg-[#f0ede8]' : ''}`}
            >
              <div className="font-semibold text-navy truncate">{c.name}</div>
              <div className="text-[11px] text-gray-500 truncate">
                {[c.street, [c.city, c.state].filter(Boolean).join(', '), c.zip].filter(Boolean).join(' · ')}
                {c.uses > 0 && <span className="ml-1.5 text-gray-400">({c.uses})</span>}
              </div>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  )
}
