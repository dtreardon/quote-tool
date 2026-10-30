import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { MORTGAGEE_MEMORY_KEYS, normalizeCompany, type MortgageeMemory } from '@/lib/mortgageeMemory'

// Agency-wide memory of the last mortgagee clause used for each referring company.
// Protected by the app password proxy. Every failure returns an empty result —
// this is a convenience and must never block the form.

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token || url.startsWith('your-')) return null
  return new Redis({ url, token })
}

const redisKey = (company: string) => `mortgagee:${company}`

// GET /api/mortgagee-memory?company=NAME → MortgageeMemory | {}
export async function GET(req: NextRequest) {
  const company = normalizeCompany(req.nextUrl.searchParams.get('company'))
  const redis = getRedis()
  if (!company || !redis) return NextResponse.json({})

  try {
    const raw = await redis.get<MortgageeMemory | string>(redisKey(company))
    if (!raw) return NextResponse.json({})
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    return NextResponse.json(data)
  } catch (err) {
    console.warn('[mortgagee-memory] GET failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({})
  }
}

// POST /api/mortgagee-memory  { company, mortgagee_name, mortgagee_street, ... }
// Latest save wins; no TTL.
export async function POST(req: NextRequest) {
  const redis = getRedis()
  if (!redis) return NextResponse.json({ saved: false })

  try {
    const body = await req.json() as Record<string, unknown>
    const company = normalizeCompany(typeof body.company === 'string' ? body.company : '')

    // Whitelist — anything else in the body (e.g. loan_number) is ignored
    const entry = Object.fromEntries(
      MORTGAGEE_MEMORY_KEYS.map(k => [k, typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, 200) : ''])
    ) as MortgageeMemory

    if (!company || !entry.mortgagee_name) return NextResponse.json({ saved: false })

    await redis.set(redisKey(company), entry)
    return NextResponse.json({ saved: true })
  } catch (err) {
    console.warn('[mortgagee-memory] POST failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ saved: false })
  }
}
