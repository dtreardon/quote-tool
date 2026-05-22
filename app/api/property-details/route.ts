import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const street = searchParams.get('street') ?? ''
  const city   = searchParams.get('city') ?? ''
  const state  = searchParams.get('state') ?? ''
  const zip    = searchParams.get('zip') ?? ''
  const apiKey = process.env.RENTCAST_API_KEY
  if (!apiKey || !street) return NextResponse.json({})
  try {
    const qs = new URLSearchParams({ address: street, city, state, zipCode: zip })
    const res = await fetch(`https://api.rentcast.io/v1/properties?${qs}`, {
      headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return NextResponse.json({})
    const raw = await res.json()
    const prop = Array.isArray(raw) ? raw[0] : raw
    if (!prop) return NextResponse.json({})
    const out: Record<string, string> = {}
    if (prop.yearBuilt) out.year_built = String(prop.yearBuilt)
    if (prop.squareFootage) out.sqft = String(Math.round(prop.squareFootage))
    if (prop.bedrooms) out.beds = String(prop.bedrooms)
    if (prop.bathrooms != null) {
      out.full_baths = String(Math.floor(prop.bathrooms))
      if (prop.bathrooms - Math.floor(prop.bathrooms) > 0) out.half_baths = '1'
    }
    const stories = prop.stories ?? prop.floors
    if (stories) out.num_stories = String(stories)
    return NextResponse.json(out)
  } catch { return NextResponse.json({}) }
}
