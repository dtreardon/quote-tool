import { NextRequest, NextResponse } from 'next/server'

const NULL_RESULT = {
  floodZone: null, bfe: null, firmPanel: null, firmEffDate: null, zoneDescription: null,
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json()
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

    const res = await fetch(
      `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?${params}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return NextResponse.json(NULL_RESULT)

    const data = await res.json()
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

    return NextResponse.json({ floodZone, bfe, firmPanel, firmEffDate, zoneDescription })
  } catch {
    return NextResponse.json(NULL_RESULT)
  }
}
