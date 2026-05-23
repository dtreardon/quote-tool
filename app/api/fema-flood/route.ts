import { NextRequest, NextResponse } from 'next/server'

const NULL_RESULT = {
  floodZone: null, bfe: null, firmPanel: null, firmEffDate: null, zoneDescription: null,
}

const BASE = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer'

// ZONE_SUBTY is only populated by FEMA for Zone X variants; all other zones need a lookup
const ZONE_DESCRIPTIONS: Record<string, string> = {
  'AE':         '1% Annual Chance Flood Hazard',
  'AO':         '1% Annual Chance Shallow Flooding',
  'AH':         '1% Annual Chance Shallow Flooding',
  'A':          '1% Annual Chance Flood Hazard',
  'A99':        '1% Annual Chance Flood Hazard (Protected by Levee)',
  'AR':         'Flood Hazard Area Returning to Natural State',
  'VE':         'Coastal High Hazard Area',
  'V':          'Coastal Flood Hazard Area',
  'X':          'Minimal Flood Hazard',
  'D':          'Undetermined Flood Hazard',
  'OPEN WATER': 'Open Water',
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json()
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

    if (!zoneRes.ok) return NextResponse.json(NULL_RESULT)

    const zoneData = await zoneRes.json()
    const zoneFeature = zoneData?.features?.[0]
    if (!zoneFeature) return NextResponse.json(NULL_RESULT)

    const a = zoneFeature.attributes
    const floodZone: string | null = a.FLD_ZONE ?? null
    const bfeRaw = a.STATIC_BFE
    const bfe = (!bfeRaw || bfeRaw <= 0 || floodZone === 'X') ? 'N/A' : String(bfeRaw)
    const zoneDescription: string | null = a.ZONE_SUBTY || ZONE_DESCRIPTIONS[floodZone ?? ''] || null

    let firmPanel: string | null = null
    let firmEffDate: string | null = null
    if (panelRes.ok) {
      const panelData = await panelRes.json()
      const panelFeature = panelData?.features?.[0]
      if (panelFeature) {
        firmPanel = panelFeature.attributes.FIRM_PAN ?? null
        const effRaw: number | null = panelFeature.attributes.EFF_DATE
        firmEffDate = effRaw
          ? new Date(effRaw).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : null
      }
    }

    return NextResponse.json({ floodZone, bfe, firmPanel, firmEffDate, zoneDescription })
  } catch {
    return NextResponse.json(NULL_RESULT)
  }
}
