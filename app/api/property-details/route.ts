import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const street = searchParams.get('street') ?? ''
  const city   = searchParams.get('city')   ?? ''
  const zip    = searchParams.get('zip')    ?? ''

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey || !street) return NextResponse.json({})

  try {
    // API expects a single address string: "486 Green Fern Dr Summerville 29483"
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

    // Response shape: { yearBuilt, Bedrooms, Bathrooms, "Area(sqft)", ... } — all top-level
    const raw = await res.json()
    if (!raw || raw.message?.startsWith('4') || raw.error) return NextResponse.json({})

    const out: Record<string, string> = {}

    if (raw.yearBuilt      != null) out.year_built  = String(raw.yearBuilt)
    if (raw['Area(sqft)']  != null) out.sqft        = String(Math.round(raw['Area(sqft)']))
    if (raw.Bedrooms       != null) out.beds        = String(raw.Bedrooms)
    if (raw.Bathrooms      != null) out.full_baths  = String(raw.Bathrooms)

    return NextResponse.json(out)
  } catch {
    return NextResponse.json({})
  }
}
