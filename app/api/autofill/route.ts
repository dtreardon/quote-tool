import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const SYSTEM_PROMPT = `You are an insurance intake assistant. Extract information from the provided document or email and return ONLY a valid JSON object — no explanation, no markdown, no backticks. If a field cannot be found, return null for that field.

Return this exact JSON structure:
{
  "primary_first": null,
  "primary_middle": null,
  "primary_last": null,
  "primary_suffix": null,
  "primary_dob": null,
  "primary_ssn_last4": null,
  "primary_phone": null,
  "primary_email": null,
  "co_insureds": [],
  "subject_address": null,
  "subject_city": null,
  "subject_state": null,
  "subject_zip": null,
  "mailing_address": null,
  "mailing_city": null,
  "mailing_state": null,
  "mailing_zip": null,
  "previous_address": null,
  "previous_city": null,
  "previous_state": null,
  "previous_zip": null,
  "closing_date": null,
  "sales_price": null,
  "loan_number": null,
  "occupancy": null,
  "referred_by_name": null,
  "referred_by_company": null,
  "mortgagee_name": null,
  "mortgagee_street": null,
  "mortgagee_city": null,
  "mortgagee_state": null,
  "mortgagee_zip": null
}

For co_insureds, return an array of objects: [{ "first": null, "middle": null, "last": null, "suffix": null, "dob": null, "ssn_last4": null }]
For name suffixes (Sr., Jr., II, III, IV, etc.): always place them in the suffix field — never include them in first_name, middle, or last. The last name field should contain only the family name with no suffix appended.
For addresses: always split into separate street, city, state, and zip fields — never concatenate into a single string.
For "Present Address" or "Current Address" on borrower/loan documents: this is where the borrower currently lives (before closing) — map it to previous_address fields, NOT mailing_address. Mailing address is only where correspondence is sent if explicitly labeled as such and different from the subject property.
For referred_by_name and referred_by_company: if this is an email, extract the sender's name and company from the From: line or email signature.
For occupancy: return one of "Primary", "Secondary", "Rental Long-term", "Rental Short-term", or null.
For dates: return in MM/DD/YYYY format.
For sales_price: return as a plain number (no $ or commas).
For SSN: return only the last 4 digits as a string.`

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      const text = formData.get('text')

      if (file instanceof File) {
        if (file.size > MAX_BYTES) {
          return NextResponse.json(
            { error: 'File exceeds the 10 MB limit.' },
            { status: 400 }
          )
        }
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')

        if (file.type === 'application/pdf') {
          userContent.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          })
        } else {
          const mediaType = (file.type || 'image/jpeg') as Anthropic.Base64ImageSource['media_type']
          userContent.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          })
        }
      }

      if (typeof text === 'string' && text.trim()) {
        userContent.push({ type: 'text', text: text.trim() })
      }
    } else {
      const body = await req.json()
      if (body.text) userContent.push({ type: 'text', text: body.text })
    }

    if (userContent.length === 0) {
      return NextResponse.json({ error: 'No content provided.' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
