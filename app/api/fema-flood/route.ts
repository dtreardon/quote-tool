import { NextRequest, NextResponse } from 'next/server'

const NULL_RESULT = {
  floodZone: null, bfe: null, firmPanel: null, firmEffDate: null, zoneDescription: null,
}

const BASE = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer'

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json()
    console.log('[FEMA API] Request received:', { lat, lng })
    if (lat == null || lng == null) return NextResponse.json(NULL_RESULT)

    const commonParams = new URLSearchParams({
      geometry:       JSON.stringify({ x: lng, y: lat }),
      geometryType:   'esriGeometryPoint',
      inSR:           '4326',
      spatialRel:     'esriSpatialRelIntersects',
      returnGeometry: 'false',
      f:              'json',
    })

    const zoneParams = new URLSearchParams(commonParams)
    zoneParams.set('outFields', 'FLD_ZONE,STATIC_BFE,ZONE_SUBTY')

    const panelParams = new URLSearchParams(commonParams)
    panelParams.set('outFields', 'FIRM_PAN,EFF_DATE')

    const [zoneRes, panelRes] = await Promise.all([
      fetch(`${BASE}/28/query?${zoneParams}`, { next: { revalidate: 86400 } }),
      fetch(`${BASE}/3/query?${panelParams}`,  { next: { revalidate: 86400 } }),
    ])

    console.log('[FEMA API] Layer 28 status:', zoneRes.status, '| Layer 3 status:', panelRes.status)
    if (!zoneRes.ok) return NextResponse.json(NULL_RESULT)

    const zoneData = await zoneRes.json()
    const zoneFeature = zoneData?.features?.[0]
    console.log('[FEMA API] Zone feature:', JSON.stringify(zoneFeature?.attributes))
    if (!zoneFeature) return NextResponse.json(NULL_RESULT)

    const a = zoneFeature.attributes
    const floodZone: string | null = a.FLD_ZONE ?? null
    const bfeRaw = a.STATIC_BFE
    const bfe = (!bfeRaw || bfeRaw <= 0 || floodZone === 'X') ? 'N/A' : String(bfeRaw)
    const zoneDescription: string | null = a.ZONE_SUBTY || null

    let firmPanel: string | null = null
    let firmEffDate: string | null = null
    if (panelRes.ok) {
      const panelData = await panelRes.json()
      const panelFeature = panelData?.features?.[0]
      console.log('[FEMA API] Panel feature:', JSON.stringify(panelFeature?.attributes))
      if (panelFeature) {
        firmPanel = panelFeature.attributes.FIRM_PAN ?? null
        const effRaw: number | null = panelFeature.attributes.EFF_DATE
        firmEffDate = effRaw
          ? new Date(effRaw).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : null
      }
    }

    const result = { floodZone, bfe, firmPanel, firmEffDate, zoneDescription }
    console.log('[FEMA API] Returning:', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[FEMA API] Error:', err)
    return NextResponse.json(NULL_RESULT)
  }
}
