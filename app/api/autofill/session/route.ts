import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/extractionPrompt'

const client = new Anthropic()

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token || url.startsWith('your-')) return null
  return new Redis({ url, token })
}

// POST /api/autofill/session
// Body: { text?: string, images?: {mediaType: string, data: string}[], from_name?: string, from_email?: string }
// Returns: { uuid: string }
export async function POST(req: NextRequest) {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json(
      { error: 'Session storage not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to environment variables.' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { text, images, from_name, from_email } = body as {
      text?: string
      images?: { mediaType: string; data: string }[]
      from_name?: string
      from_email?: string
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = []

    // Prepend sender context so Claude can extract referred_by fields
    const senderNote =
      from_name || from_email
        ? `Email sender — Name: ${from_name ?? ''}, Email: ${from_email ?? ''}\n\n`
        : ''

    if (text?.trim()) {
      userContent.push({ type: 'text', text: senderNote + text.trim() })
    } else if (senderNote) {
      userContent.push({ type: 'text', text: senderNote })
    }

    // Inline images sent as base64
    if (Array.isArray(images)) {
      for (const img of images) {
        if (img.data && img.mediaType) {
          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mediaType as Anthropic.Base64ImageSource['media_type'],
              data: img.data,
            },
          })
        }
      }
    }

    if (userContent.length === 0) {
      return NextResponse.json({ error: 'No content provided.' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw   = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json\n?|```/g, '').trim()
    const extracted = JSON.parse(clean)

    const uuid = crypto.randomUUID()
    await redis.set(`session:${uuid}`, JSON.stringify(extracted), { ex: 3600 })

    return NextResponse.json({ uuid })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/autofill/session?id=UUID
// Returns the extracted JSON stored for this session
export async function GET(req: NextRequest) {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({ error: 'Session storage not configured.' }, { status: 503 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter.' }, { status: 400 })
  }

  try {
    const raw = await redis.get<string>(`session:${id}`)
    if (!raw) {
      return NextResponse.json({ error: 'Session not found or expired.' }, { status: 404 })
    }
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
