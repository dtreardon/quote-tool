import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import {
  MORTGAGEE_MEMORY_KEYS, byCountThenRecent, byUsesThenRecent, clauseId, clauseToForm, companyKey, normalizeCompany,
  type ClauseRecord, type CompanyClause, type LibraryClause, type MortgageeMemory,
} from '@/lib/mortgageeMemory'

// Agency-wide mortgagee clause memory: a library of clauses plus, per referring
// company, how often each clause was used. Protected by the app password proxy.
// Every failure returns an empty result — this is a convenience and must never
// block the form.
//
// Keys (Upstash):
//   mm:clause:{clauseId}  → ClauseRecord
//   mm:clauses            → set of clauseIds
//   mm:company:{company}  → { [clauseId]: { count, lastUsed } }
//   mm:sheet:{sheetId}    → { companyKey, clauseId }  (one count per saved sheet)
//   mm:migrated           → set once every legacy entry has been copied into the library
//   mortgagee:{company}   → LEGACY one-clause-per-company entry. Read only — never written or deleted.
// Loan number is never stored.

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token || url.startsWith('your-')) return null
  return new Redis({ url, token })
}

type Links = Record<string, { count: number; lastUsed: number }>
interface SheetLink { companyKey: string; clauseId: string }

const K = {
  clause:   (id: string) => `mm:clause:${id}`,
  clauses:  'mm:clauses',
  company:  (key: string) => `mm:company:${key}`,
  sheet:    (id: string) => `mm:sheet:${id}`,
  migrated: 'mm:migrated',
  legacy:   (company: string) => `mortgagee:${company}`,
  legacyPattern: 'mortgagee:*',
}

const SHEET_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const warn = (what: string, err: unknown) =>
  console.warn(`[mortgagee-memory] ${what} failed:`, err instanceof Error ? err.message : err)

async function getJSON<T>(redis: Redis, key: string): Promise<T | null> {
  const raw = await redis.get<T | string>(key)
  if (raw === null || raw === undefined) return null
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T
}

const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 200) : '')

function legacyToClause(m: Partial<MortgageeMemory> | null) {
  if (!m || !clean(m.mortgagee_name)) return null
  return {
    name: clean(m.mortgagee_name), street: clean(m.mortgagee_street), city: clean(m.mortgagee_city),
    state: clean(m.mortgagee_state), zip: clean(m.mortgagee_zip),
  }
}

// Copies one legacy entry into the library and links it to the company with count 1.
// Skips a clause the company is already linked to, so repeating it never inflates counts.
// The legacy key itself is never touched.
async function migrateLegacy(redis: Redis, ck: string, entry: Partial<MortgageeMemory> | null): Promise<CompanyClause | null> {
  const c = legacyToClause(entry)
  if (!c || !ck) return null
  const id = clauseId(c)
  const links = (await getJSON<Links>(redis, K.company(ck))) ?? {}
  const existing = await getJSON<ClauseRecord>(redis, K.clause(id))
  const now = Date.now()
  if (!links[id]) {
    const rec: ClauseRecord = existing
      ? { ...existing, uses: (existing.uses ?? 0) + 1 }
      : { ...c, uses: 1, lastUsed: now }
    links[id] = { count: 1, lastUsed: rec.lastUsed }
    await redis.set(K.clause(id), rec)
    await redis.sadd(K.clauses, id)
    await redis.set(K.company(ck), links)
  }
  return { id, ...c, count: links[id].count, lastUsed: links[id].lastUsed }
}

// Copies every legacy entry into the library the first time the library is listed.
async function migrateAllLegacy(redis: Redis): Promise<void> {
  if (await redis.get(K.migrated)) return
  let cursor: string | number = 0
  do {
    const [next, keys]: [string | number, string[]] = await redis.scan(cursor, { match: K.legacyPattern, count: 200 })
    cursor = next
    for (const key of keys) {
      const legacyCompany = key.slice('mortgagee:'.length)
      const entry = await getJSON<Partial<MortgageeMemory>>(redis, key)
      await migrateLegacy(redis, companyKey(legacyCompany), entry)
    }
  } while (String(cursor) !== '0')
  await redis.set(K.migrated, new Date().toISOString())
}

// Response for a company lookup. The top-level mortgagee_* fields are the top clause in
// the legacy shape, so a browser tab still running the previous version keeps working.
function companyResponse(clauses: CompanyClause[], legacy = false) {
  const top = clauses[0]
  return NextResponse.json({ ...(top ? clauseToForm(top) : {}), clauses, ...(legacy ? { legacy: true } : {}) })
}

async function readLegacy(redis: Redis, company: string) {
  const old = normalizeCompany(company)
  return old ? getJSON<Partial<MortgageeMemory>>(redis, K.legacy(old)) : null
}

// GET /api/mortgagee-memory?company=NAME → { clauses: CompanyClause[] (most used first), ...top clause } | {}
// GET /api/mortgagee-memory?library=1    → { clauses: LibraryClause[] (most used first) }
export async function GET(req: NextRequest) {
  const redis = getRedis()
  const params = req.nextUrl.searchParams

  if (params.get('library')) {
    if (!redis) return NextResponse.json({ clauses: [] })
    try {
      await migrateAllLegacy(redis).catch(err => warn('legacy migration', err))
      const ids = await redis.smembers(K.clauses)
      const clauses: LibraryClause[] = []
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100)
        const recs = await redis.mget<(ClauseRecord | string | null)[]>(...chunk.map(K.clause))
        recs.forEach((raw, j) => {
          try {
            const r = (typeof raw === 'string' ? JSON.parse(raw) : raw) as ClauseRecord | null
            if (r?.name) clauses.push({ id: chunk[j], name: r.name, street: r.street ?? '', city: r.city ?? '', state: r.state ?? '', zip: r.zip ?? '', uses: r.uses ?? 0, lastUsed: r.lastUsed ?? 0 })
          } catch { /* skip an unreadable record */ }
        })
      }
      clauses.sort(byUsesThenRecent)
      return NextResponse.json({ clauses })
    } catch (err) {
      warn('library GET', err)
      return NextResponse.json({ clauses: [] })
    }
  }

  const company = params.get('company') ?? ''
  const ck = companyKey(company)
  if (!ck || !redis) return NextResponse.json({})

  // New keys first
  try {
    const links = await getJSON<Links>(redis, K.company(ck))
    const ids = Object.keys(links ?? {})
    if (links && ids.length) {
      const recs = await redis.mget<(ClauseRecord | string | null)[]>(...ids.map(K.clause))
      const clauses: CompanyClause[] = []
      recs.forEach((raw, i) => {
        const r = (typeof raw === 'string' ? JSON.parse(raw) : raw) as ClauseRecord | null
        const link = links[ids[i]]
        if (r?.name && link && link.count > 0) {
          clauses.push({ id: ids[i], name: r.name, street: r.street ?? '', city: r.city ?? '', state: r.state ?? '', zip: r.zip ?? '', count: link.count, lastUsed: link.lastUsed ?? 0 })
        }
      })
      if (clauses.length) return companyResponse(clauses.sort(byCountThenRecent))
    }
  } catch (err) {
    warn('company GET', err)
  }

  // No (readable) new entry — fall back to the legacy entry, migrating it when possible
  try {
    const entry = await readLegacy(redis, company)
    const c = legacyToClause(entry)
    if (!c) return NextResponse.json({})
    const migrated = await migrateLegacy(redis, ck, entry).catch(err => { warn('lazy migration', err); return null })
    return companyResponse([migrated ?? { id: clauseId(c), ...c, count: 1, lastUsed: 0 }], true)
  } catch (err) {
    warn('legacy GET', err)
    return NextResponse.json({})
  }
}

// POST /api/mortgagee-memory  { company, sheetId?, mortgagee_name, mortgagee_street, mortgagee_city, mortgagee_state, mortgagee_zip }
// Upserts the clause and counts it once per sheet for the company.
export async function POST(req: NextRequest) {
  const redis = getRedis()
  if (!redis) return NextResponse.json({ saved: false })

  try {
    const body = await req.json() as Record<string, unknown>
    const ck = companyKey(typeof body.company === 'string' ? body.company : '')

    // Whitelist — anything else in the body (e.g. loan_number) is ignored
    const entry = Object.fromEntries(MORTGAGEE_MEMORY_KEYS.map(k => [k, clean(body[k])])) as MortgageeMemory
    const c = legacyToClause(entry)
    if (!ck || !c) return NextResponse.json({ saved: false })

    const id = clauseId(c)
    const now = Date.now()
    const sheetId = typeof body.sheetId === 'string' && SHEET_ID_RE.test(body.sheetId) ? body.sheetId.toLowerCase() : ''

    const existing = await getJSON<ClauseRecord>(redis, K.clause(id))
    // Display values follow the latest saved spelling
    const rec: ClauseRecord = { ...c, uses: existing?.uses ?? 0, lastUsed: existing?.lastUsed ?? now }

    const prev = sheetId ? await getJSON<SheetLink>(redis, K.sheet(sheetId)) : null
    if (prev && prev.companyKey === ck && prev.clauseId === id) {
      // Same sheet saved again with the same company and clause — already counted
      await redis.set(K.clause(id), rec)
      await redis.sadd(K.clauses, id)
      return NextResponse.json({ saved: true, counted: false })
    }

    // This sheet was counted under a different company or clause — move the count
    if (prev?.companyKey && prev.clauseId) {
      const oldLinks = await getJSON<Links>(redis, K.company(prev.companyKey))
      if (oldLinks?.[prev.clauseId]) {
        const n = (oldLinks[prev.clauseId].count ?? 1) - 1
        if (n > 0) oldLinks[prev.clauseId].count = n
        else delete oldLinks[prev.clauseId]
        await redis.set(K.company(prev.companyKey), oldLinks)
      }
      if (prev.clauseId === id) {
        rec.uses = Math.max(0, rec.uses - 1)
      } else {
        const oldClause = await getJSON<ClauseRecord>(redis, K.clause(prev.clauseId))
        if (oldClause) await redis.set(K.clause(prev.clauseId), { ...oldClause, uses: Math.max(0, (oldClause.uses ?? 1) - 1) })
      }
    }

    // Count it
    const links = (await getJSON<Links>(redis, K.company(ck))) ?? {}
    links[id] = { count: (links[id]?.count ?? 0) + 1, lastUsed: now }
    rec.uses += 1
    rec.lastUsed = now
    await redis.set(K.clause(id), rec)
    await redis.sadd(K.clauses, id)
    await redis.set(K.company(ck), links)
    if (sheetId) await redis.set(K.sheet(sheetId), { companyKey: ck, clauseId: id } satisfies SheetLink)
    return NextResponse.json({ saved: true, counted: true })
  } catch (err) {
    warn('POST', err)
    return NextResponse.json({ saved: false })
  }
}
