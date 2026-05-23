import { NextRequest, NextResponse } from 'next/server'

const NULL_RESULT = {
  floodZone: null, bfe: null, firmPanel: null, firmEffDate: null, zoneDescription: null,
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json()
    console.log('[FEMA API] Request received:', { lat, lng })
    if (lat == null || lng == null) return NextResponse.json(NULL_RESULT)

    const params = new URLSearchParams({
      geometry:     JSON.stringify({ x: lng, y: lat }),
      geometryType: 'esriGeometryPoint',
      inSR:         '4326',
      spatialRel:   'esriSpatialRelIntersects',
      outFields:    'FLD_ZONE,BFE_DIVA,FIRM_PAN,EFF_DATE,ZONE_SUBTY',
      returnGeometry: 'false',
      f: 'json',
    })

    const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?${params}`
    console.log('[FEMA API] Querying FEMA:', url)
    const res = await fetch(url, { next: { revalidate: 86400 } })
    console.log('[FEMA API] FEMA response status:', res.status, res.ok)
    if (!res.ok) return NextResponse.json(NULL_RESULT)

    const data = await res.json()
    console.log('[FEMA API] Feature count:', data?.features?.length, '| First feature:', JSON.stringify(data?.features?.[0]?.attributes))
    const feature = data?.features?.[0]
    if (!feature) return NextResponse.json(NULL_RESULT)

    const a = feature.attributes
    const floodZone: string | null = a.FLD_ZONE ?? null
    const bfeRaw = a.BFE_DIVA
    const bfe = (!bfeRaw || bfeRaw <= 0 || floodZone === 'X') ? 'N/A' : String(bfeRaw)
    const firmPanel: string | null = a.FIRM_PAN ?? null
    const effRaw: number | null = a.EFF_DATE
    const firmEffDate = effRaw
      ? new Date(effRaw).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      : null
    const zoneDescription: string | null = a.ZONE_SUBTY || null

    const result = { floodZone, bfe, firmPanel, firmEffDate, zoneDescription }
    console.log('[FEMA API] Returning:', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[FEMA API] Error:', err)
    return NextResponse.json(NULL_RESULT)
  }
}
