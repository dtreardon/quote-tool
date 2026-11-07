import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Agency-wide invoice numbers: RA-YYYY-NNNN, one counter per year
// (invoice-seq:2026, invoice-seq:2027, …) so numbering restarts each January.
// Protected by the app password proxy. Unlike mortgagee memory, failures are
// reported as errors — the Bind panel must not create an invoice without a number.

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token || url.startsWith('your-')) return null
  return new Redis({ url, token })
}

// POST /api/invoice-number  { year: 2026 } → { invoiceNumber: "RA-2026-0001" }
// The year comes from the agent's local clock; it must be within a year of the server's.
export async function POST(req: NextRequest) {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({ error: 'Invoice numbering is not configured (Upstash).' }, { status: 503 })
  }

  let year: number
  try {
    const body = await req.json() as { year?: unknown }
    year = Number(body.year)
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const serverYear = new Date().getUTCFullYear()
  if (!Number.isInteger(year) || Math.abs(year - serverYear) > 1) {
    return NextResponse.json({ error: `Invalid invoice year: ${year}` }, { status: 400 })
  }

  try {
    const seq = await redis.incr(`invoice-seq:${year}`)
    return NextResponse.json({ invoiceNumber: `RA-${year}-${String(seq).padStart(4, '0')}` })
  } catch (err) {
    console.warn('[invoice-number] INCR failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Could not reach the invoice counter (Upstash).' }, { status: 502 })
  }
}
