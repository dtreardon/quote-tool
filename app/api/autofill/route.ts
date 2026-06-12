import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/extractionPrompt'

const client = new Anthropic()

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

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
      max_tokens: 8192,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json\n?|```/g, '').trim()
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json(
        { error: 'Auto-fill could not parse the response. The document may be too complex — try pasting the text instead.' },
        { status: 422 }
      )
    }
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
