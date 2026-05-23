'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Incorrect password.')
        setPassword('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-[#d0cdc8] shadow-[0_4px_32px_rgba(51,78,133,0.12)] px-8 py-10">

        <div className="flex justify-center mb-7">
          <Image
            src="/logo.png"
            alt="Robinson & Associates"
            width={160}
            height={64}
            className="object-contain"
            priority
          />
        </div>

        <div className="text-center mb-7">
          <h1 className="font-serif text-navy text-[17px] font-bold leading-snug mb-1">
            QuoteSheetPRO
          </h1>
          <p className="text-[13px] text-gray-500">Enter your password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="w-full rounded border border-[#d0cdc8] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-colors"
          />

          {error && (
            <p className="text-red-600 text-[13px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-navy hover:bg-[#4a6aaa] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          QuoteSheetPRO is a product of Reardon Insurance, LLC
        </p>
      </div>
    </div>
  )
}
