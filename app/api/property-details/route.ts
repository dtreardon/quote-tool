import { NextRequest, NextResponse } from 'next/server'

// Exact values from Section5 Roof Type select: ['Architectural','3-Tab','Metal','Tile','Wood Shake','Flat/TPO','Other']
function mapRoofType(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.toLowerCase().trim()
  if (s.includes('3-tab') || s.includes('3 tab')) return '3-Tab'
  if (s.includes('asphalt') && !s.includes('architectural')) return '3-Tab'
  if (s.includes('architectural') || s.includes('composition') || s.includes('dimensional') || s.includes('laminated')) return 'Architectural'
  if (s === 'shingle' || s === 'asphalt shingle') return 'Architectural'
  if (s.includes('metal') || s.includes('steel') || s.includes('aluminum')) return 'Metal'
  if (s.includes('tile') || s.includes('clay') || s.includes('concrete tile')) return 'Tile'
  if (s.includes('wood') || s.includes('shake') || s.includes('cedar')) return 'Wood Shake'
  if (s.includes('flat') || s.includes('built-up') || s.includes('built up') || s.includes('tpo') || s.includes('foam')) return 'Flat/TPO'
  return null
}

// Exact values from Section5 Construction Type select: ['Brick','Hardi','Vinyl','Stone','Stucco','Tabby','Wood','Cinderblock']
function mapConstruction(materials: unknown): string | null {
  if (!Array.isArray(materials) || materials.length === 0) return null
  for (const m of materials) {
    const s = String(m).toLowerCase().trim()
    if (s.includes('brick')) return 'Brick'
    if (s.includes('fiber cement') || s.includes('hardie') || s.includes('hardi')) return 'Hardi'
    if (s.includes('vinyl')) return 'Vinyl'
    if (s.includes('stone') || s.includes('rock')) return 'Stone'
    if (s.includes('stucco')) return 'Stucco'
    if (s.includes('tabby')) return 'Tabby'
    if (s.includes('cbs') || s.includes('concrete block') || s.includes('cinderblock') || s.includes('cinder block') || s.includes('masonry block')) return 'Cinderblock'
    if (s.includes('wood') || s.includes('frame') || s.includes('wood siding') || s.includes('wood shingle') || s.includes('wood board')) return 'Wood'
  }
  return null
}

// Exact values from Section5 Foundation Type select: ['Slab','Crawlspace','Raised Slab','Enclosure','Piers','Basement']
function mapFoundation(details: unknown): string | null {
  if (!Array.isArray(details) || details.length === 0) return null
  for (const d of details) {
    const s = String(d).toLowerCase().trim()
    if (s.includes('crawl')) return 'Crawlspace'
    if (s.includes('basement')) return 'Basement'
    if (s.includes('pier') || s.includes('piling') || s.includes('stilt')) return 'Piers'
    if (s.includes('enclosure')) return 'Enclosure'
    if (s.includes('raised slab')) return 'Raised Slab'
    if (s.includes('slab')) return 'Slab'
  }
  return null
}

// Exact values from Section5 Heat/Air select:
// ['Central Heat & Air','Central Heat / Window AC','Window Units Only','Baseboard','Radiator','Mini-Split','None']
function mapHeatAir(heating: unknown): string | null {
  if (!Array.isArray(heating) || heating.length === 0) return null
  for (const h of heating) {
    const s = String(h).toLowerCase().trim()
    if (s.includes('forced air') || s.includes('central') || s.includes('furnace') ||
        s.includes('heat pump') || s.includes('electric') || s.includes('natural gas') || s.includes('gas')) {
      return 'Central Heat & Air'
    }
    if (s.includes('baseboard')) return 'Baseboard'
    if (s.includes('radiator')) return 'Radiator'
    if (s.includes('mini') || s.includes('split') || s.includes('ductless')) return 'Mini-Split'
    if (s.includes('window')) return 'Window Units Only'
  }
  return null
}

// Exact values from Section5 Burglar Alarm select: ['None','Local','Central Station','Direct','Smart']
function mapBurglarAlarm(features: unknown): string | null {
  if (!Array.isArray(features)) return null
  const joined = features.map(f => String(f).toLowerCase()).join(' ')
  if (joined.includes('security system') || joined.includes('monitored')) return 'Central Station'
  if (joined.includes('alarm')) return 'Local'
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>

const RAPIDAPI_HEADERS = (apiKey: string) => ({
  'x-rapidapi-host': 'zllw-working-api.p.rapidapi.com',
  'x-rapidapi-key':  apiKey,
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const street = searchParams.get('street') ?? ''
  const city   = searchParams.get('city')   ?? ''
  const zip    = searchParams.get('zip')    ?? ''

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey || !street) return NextResponse.json({})

  try {
    // ── Step 1: summary lookup by address (returns ZPID + basic fields) ──
    const propertyaddress = [street, city, zip].filter(Boolean).join(' ')
    const summaryUrl = `https://zllw-working-api.p.rapidapi.com/byaddress?propertyaddress=${encodeURIComponent(propertyaddress)}`
    console.log('[property-details] step1 fetching:', propertyaddress)

    const summaryRes = await fetch(summaryUrl, {
      headers: RAPIDAPI_HEADERS(apiKey),
      cache: 'no-store',
    })
    if (!summaryRes.ok) {
      console.log('[property-details] step1 non-OK:', summaryRes.status)
      return NextResponse.json({})
    }

    const summary: Rec = await summaryRes.json()
    if (!summary || summary.error) {
      console.log('[property-details] step1 error:', summary?.error)
      return NextResponse.json({})
    }

    console.log('[property-details] step1 keys:', Object.keys(summary))

    // Basic fields always available from summary
    const out: Record<string, string> = {}
    const yearBuilt  = summary.yearBuilt
    const livingArea = summary['Area(sqft)']
    const bedrooms   = summary.Bedrooms
    const bathrooms  = summary.Bathrooms

    if (yearBuilt  != null) out.year_built = String(yearBuilt)
    if (livingArea != null) out.sqft       = String(Math.round(Number(livingArea)))
    if (bedrooms   != null) out.beds       = String(bedrooms)
    if (bathrooms  != null) out.full_baths = String(Math.floor(Number(bathrooms)))

    // ── Step 2: full details via ZPID (contains resoFacts) ──
    const zpid = summary.PropertyZPID
    if (!zpid) {
      console.log('[property-details] no ZPID in summary — returning basic fields only')
      console.log('[property-details] final output:', out)
      return NextResponse.json(out)
    }

    console.log('[property-details] step2 fetching zpid:', zpid)
    const detailUrl = `https://zllw-working-api.p.rapidapi.com/propertyDetails?zpid=${encodeURIComponent(zpid)}`
    const detailRes = await fetch(detailUrl, {
      headers: RAPIDAPI_HEADERS(apiKey),
      cache: 'no-store',
    })

    if (!detailRes.ok) {
      console.log('[property-details] step2 non-OK:', detailRes.status, '— returning basic fields only')
      console.log('[property-details] final output:', out)
      return NextResponse.json(out)
    }

    const detail: Rec = await detailRes.json()
    console.log('[property-details] step2 raw (full):', JSON.stringify(detail).slice(0, 3000))

    // Navigate to propertyDetails / resoFacts if present
    const prop: Rec = detail.propertyDetails ?? detail
    const rF: Rec   = prop?.resoFacts ?? {}

    console.log('[property-details] step2 prop keys:', Object.keys(prop))
    console.log('[property-details] step2 resoFacts keys:', Object.keys(rF))

    // ── Override bathrooms with bathroomsFull if available ──
    if (rF.bathroomsFull != null) out.full_baths = String(Math.floor(Number(rF.bathroomsFull)))
    if (rF.bathroomsHalf != null) out.half_baths  = String(rF.bathroomsHalf)
    if (rF.stories       != null) out.num_stories  = String(rF.stories)

    // --- Roof ---
    const roofMapped = mapRoofType(rF.roofType)
    console.log('[property-details] roofType:', rF.roofType, '→', roofMapped)
    if (roofMapped) out.roof_type = roofMapped

    // --- Construction ---
    const constructionMapped = mapConstruction(rF.constructionMaterials)
    console.log('[property-details] constructionMaterials:', rF.constructionMaterials, '→', constructionMapped)
    if (constructionMapped) out.construction_type = constructionMapped

    // --- Foundation ---
    const foundationMapped = mapFoundation(rF.foundationDetails)
    console.log('[property-details] foundationDetails:', rF.foundationDetails, '→', foundationMapped)
    if (foundationMapped) out.foundation_type = foundationMapped

    // --- Garage ---
    if (rF.hasGarage === false) {
      out.garage_type = 'None'
    } else if (rF.hasAttachedGarage === true) {
      out.garage_type = 'Attached / Built-in'
    } else if (rF.hasGarage === true) {
      out.garage_type = 'Detached'
    }
    if (rF.garageParkingCapacity != null) out.garage_cars = String(rF.garageParkingCapacity)
    console.log('[property-details] garage:', { hasGarage: rF.hasGarage, hasAttachedGarage: rF.hasAttachedGarage, capacity: rF.garageParkingCapacity }, '→ type:', out.garage_type, 'cars:', out.garage_cars)

    // --- Heat / Air ---
    const heatMapped = mapHeatAir(rF.heating)
    console.log('[property-details] heating:', rF.heating, '→', heatMapped)
    if (heatMapped) out.heat_air = heatMapped

    // --- Fireplaces ---
    if (rF.fireplaces != null && Number(rF.fireplaces) > 0) {
      out.fireplaces = String(rF.fireplaces)
    } else if (rF.hasFireplace === true) {
      out.fireplaces = '1'
    }

    // --- Pool ---
    if (rF.hasPrivatePool === true)  out.pool = 'yes'
    if (rF.hasPrivatePool === false) out.pool = 'no'

    // --- Security / community ---
    const burglarMapped = mapBurglarAlarm(rF.securityFeatures)
    if (burglarMapped) out.burglar_alarm = burglarMapped

    if (Array.isArray(rF.communityFeatures)) {
      const isGated = (rF.communityFeatures as unknown[]).some(f => String(f).toLowerCase().includes('gated'))
      if (isGated) out.gated = 'yes'
    }

    console.log('[property-details] final output:', out)
    return NextResponse.json(out)
  } catch (err) {
    console.error('[property-details] error:', err)
    return NextResponse.json({})
  }
}
