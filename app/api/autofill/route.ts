import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/extractionPrompt'

const client = new Anthropic()

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const IS_DEV = process.env.NODE_ENV !== 'production'

// Quick sanity check so a bad/mismatched key shows up in the server console
// immediately instead of after a confusing 401 mid-request. Never logs the
// full key.
{
  const key = process.env.ANTHROPIC_API_KEY || ''
  console.log(
    key
      ? `[autofill] ANTHROPIC_API_KEY loaded: ${key.slice(0, 6)}...${key.slice(-6)} (length ${key.length})`
      : '[autofill] ANTHROPIC_API_KEY is NOT set'
  )
}

const ANTHROPIC_ERROR_LABELS: Record<string, string> = {
  authentication_error: 'invalid API key',
  permission_error: 'permission denied',
  rate_limit_error: 'rate limited',
  overloaded_error: 'overloaded',
  invalid_request_error: 'invalid request',
  not_found_error: 'not found',
  api_error: 'server error',
}

// Logs full diagnostic detail server-side and returns a short "type" string
// (e.g. "401 - invalid API key") suitable for surfacing to devs on the client.
function describeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    let label =
      (err.type && ANTHROPIC_ERROR_LABELS[err.type]) ||
      err.type ||
      undefined

    if (!label) {
      if (err.name === 'APIConnectionTimeoutError') label = 'timeout'
      else if (err.name === 'APIConnectionError') label = 'connection error'
      else label = err.name || 'api_error'
    }

    console.error(
      `[autofill] Anthropic API error — status=${err.status ?? 'n/a'} type=${err.type ?? 'n/a'} name=${err.name} message=${err.message}`
    )

    return err.status ? `${err.status} - ${label}` : label
  }

  if (err instanceof Error) {
    console.error(`[autofill] Unexpected error: ${err.name}: ${err.message}`, err.stack)
    return err.message
  }

  console.error('[autofill] Unknown non-Error thrown:', err)
  return 'unknown error'
}

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
    const match = raw.match(/\{[\s\S]*\}/)

    if (!match) {
      console.error('[autofill] No JSON object found in Claude response. Raw response follows:')
      console.error(raw)
      return NextResponse.json(
        {
          error: 'Auto-fill could not parse the response. The document may be too complex — try pasting the text instead.',
          ...(IS_DEV ? { errorDetail: 'no JSON found in response' } : {}),
        },
        { status: 422 }
      )
    }

    let parsed
    try {
      parsed = JSON.parse(match[0])
    } catch (parseErr) {
      console.error('[autofill] JSON.parse failed on extracted match. Raw response follows:')
      console.error(raw)
      console.error('[autofill] Parse error:', parseErr)
      return NextResponse.json(
        {
          error: 'Auto-fill could not parse the response. The document may be too complex — try pasting the text instead.',
          ...(IS_DEV ? { errorDetail: `JSON parse error: ${parseErr instanceof Error ? parseErr.message : 'unknown'}` } : {}),
        },
        { status: 422 }
      )
    }
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const detail = describeError(err)
    const status = err instanceof Anthropic.APIError && err.status ? err.status : 500
    return NextResponse.json(
      {
        error: 'Auto-fill failed while contacting the AI service.',
        ...(IS_DEV ? { errorDetail: detail } : {}),
      },
      { status }
    )
  }
}
