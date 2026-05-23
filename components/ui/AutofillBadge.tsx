'use client'
import { useState } from 'react'

interface AutofillBadgeProps {
  className?: string
}

export function AutofillBadge({ className = 'text-gray-400 hover:text-gray-600' }: AutofillBadgeProps) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative flex-shrink-0">
      <button
        type="button"
        tabIndex={-1}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className={`w-4 h-4 flex items-center justify-center transition-colors ${className}`}
        aria-label="Auto-filled"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z" />
        </svg>
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-800 text-white text-[11px] font-medium rounded px-2 py-0.5 whitespace-nowrap z-50 pointer-events-none shadow-sm">
          Auto-filled
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  )
}
