import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const street = searchParams.get('street') ?? ''
  const city   = searchParams.get('city')   ?? ''
  const zip    = searchParams.get('zip')    ?? ''

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey || !street) return NextResponse.json({})

  try {
    const propertyaddress = [street, city, zip].filter(Boolean).join(' ')
    const url = `https://zllw-working-api.p.rapidapi.com/byaddress?propertyaddress=${encodeURIComponent(propertyaddress)}`

    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'zllw-working-api.p.rapidapi.com',
        'x-rapidapi-key':  apiKey,
      },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({})

    const raw: Rec = await res.json()
    if (!raw || raw.error) return NextResponse.json({})

    // This API only returns basic summary fields — no resoFacts available.
    const out: Record<string, string> = {}

    if (raw.yearBuilt    != null) out.year_built  = String(raw.yearBuilt)
    if (raw['Area(sqft)'] != null) out.sqft        = String(Math.round(Number(raw['Area(sqft)'])))
    if (raw.Bedrooms     != null) out.beds         = String(raw.Bedrooms)
    if (raw.Bathrooms    != null) out.full_baths   = String(Math.floor(Number(raw.Bathrooms)))

    return NextResponse.json(out)
  } catch {
    return NextResponse.json({})
  }
}
