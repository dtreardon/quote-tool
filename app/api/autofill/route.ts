import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are extracting insurance intake data from a document or email. Extract any of the following fields you can find and return ONLY a JSON object with no explanation, no markdown, no backticks. Use null for any field not found.

{
  "first_name": null,
  "middle_name": null,
  "last_name": null,
  "dob": null,
  "ssn": null,
  "occupation": null,
  "email1": null,
  "phone1": null,
  "marital_status": null,
  "prop_street": null,
  "prop_city": null,
  "prop_state": null,
  "prop_zip": null,
  "mail_street": null,
  "mail_city": null,
  "mail_state": null,
  "mail_zip": null,
  "sales_price": null,
  "loan_number": null,
  "mortgagee": null,
  "closing_date": null,
  "closing_contact": null,
  "year_built": null,
  "current_carrier": null,
  "premium": null,
  "new_purchase": null,
  "occupancy": null
}

For new_purchase return "yes" or "no". For occupancy return "Primary", "Secondary", "Rental - Long-term", or "Rental - Short-term". For dob use MM/DD/YYYY format. For sales_price return numbers only (no $ sign). Return only the JSON.`

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let textContent = ''
    let imageContent: Anthropic.ImageBlockParam | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const text = formData.get('text')
      const file = formData.get('file')

      if (typeof text === 'string' && text.trim()) {
        textContent = text
      }

      if (file instanceof File) {
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mediaType = (file.type as Anthropic.Base64ImageSource['media_type']) || 'image/jpeg'

        if (file.type === 'application/pdf') {
          // PDFs not supported as images — extract text hint
          textContent += '\n[PDF file uploaded — extract visible text fields]'
        } else {
          imageContent = {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          }
        }
      }
    } else {
      const body = await req.json()
      textContent = body.text || ''
    }

    if (!textContent && !imageContent) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const userContent: Anthropic.MessageParam['content'] = []
    if (imageContent) userContent.push(imageContent)
    if (textContent) userContent.push({ type: 'text', text: textContent })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
