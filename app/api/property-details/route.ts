import { NextRequest, NextResponse } from 'next/server'

// Maps Zillow roof type strings to the form's select values
const ROOF_TYPE_MAP: Record<string, string> = {
  'composition':            'Architectural',
  'asphalt':                'Architectural',
  'architectural':          'Architectural',
  'architectural shingles': 'Architectural',
  '3-tab':                  '3-Tab',
  'tab':                    '3-Tab',
  'metal':                  'Metal',
  'tile':                   'Tile',
  'clay':                   'Tile',
  'concrete':               'Tile',
  'wood shake':             'Wood Shake',
  'wood shingles':          'Wood Shake',
  'shake':                  'Wood Shake',
  'built up':               'Flat/TPO',
  'built-up':               'Flat/TPO',
  'flat':                   'Flat/TPO',
  'tpo':                    'Flat/TPO',
  'other':                  'Other',
}

function mapRoofType(raw: string | null | undefined): string | null {
  if (!raw) return null
  return ROOF_TYPE_MAP[raw.toLowerCase().trim()] ?? null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const street = searchParams.get('street') ?? ''
  const city   = searchParams.get('city')   ?? ''
  const state  = searchParams.get('state')  ?? ''
  const zip    = searchParams.get('zip')    ?? ''
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey || !street) return NextResponse.json({})

  try {
    const address = [street, city, state].filter(Boolean).join(', ')
    const qs = new URLSearchParams({ address, zipcode: zip })
    const res = await fetch(
      `https://zllw-working-api.p.rapidapi.com/By%20Property%20Address?${qs}`,
      {
        headers: {
          'x-rapidapi-host': 'zllw-working-api.p.rapidapi.com',
          'x-rapidapi-key':  apiKey,
        },
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return NextResponse.json({})
    const raw = await res.json()
    const prop = raw?.propertyDetails
    if (!prop) return NextResponse.json({})

    const out: Record<string, string> = {}

    if (prop.yearBuilt  != null) out.year_built = String(prop.yearBuilt)
    if (prop.livingArea != null) out.sqft       = String(Math.round(prop.livingArea))
    if (prop.bedrooms   != null) out.beds       = String(prop.bedrooms)

    const fullBaths = prop.resoFacts?.bathroomsFull ?? prop.bathrooms
    if (fullBaths != null) out.full_baths = String(Math.floor(Number(fullBaths)))

    if (prop.resoFacts?.bathroomsHalf != null)
      out.half_baths = String(prop.resoFacts.bathroomsHalf)

    if (prop.resoFacts?.stories != null)
      out.num_stories = String(prop.resoFacts.stories)

    const roofMapped = mapRoofType(prop.resoFacts?.roofType)
    if (roofMapped) out.roof_type = roofMapped

    return NextResponse.json(out)
  } catch {
    return NextResponse.json({})
  }
}
