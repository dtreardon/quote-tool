import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'node:fs'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function launchBrowser() {
  const puppeteer = (await import('puppeteer-core')).default

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default
    const executablePath = await chromium.executablePath()
    return puppeteer.launch({
      executablePath,
      args: chromium.args,
      headless: 'shell',
    })
  }

  // Local dev: find installed Chrome
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean) as string[]

  const executablePath = candidates.find(p => existsSync(p))
  if (!executablePath) {
    throw new Error(
      'Chrome not found for local PDF generation. ' +
      'Install Chrome or set the CHROME_PATH environment variable.'
    )
  }

  return puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  })
}

export async function POST(req: NextRequest) {
  let browser
  try {
    const { html, filename } = await req.json() as { html: string; filename?: string }
    if (!html) return NextResponse.json({ error: 'Missing html' }, { status: 400 })

    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })

    const pdfUint8 = await page.pdf({
      format: 'Letter',
      printBackground: true,
      // Match the @page margins defined in buildPrintHTML / buildAutoPrintHTML
      margin: { top: '0.25in', right: '0.25in', bottom: '0.2in', left: '0.25in' },
    })

    // Slice to a plain ArrayBuffer (satisfies NextResponse's BodyInit constraint)
    const pdfBuffer = pdfUint8.buffer.slice(
      pdfUint8.byteOffset,
      pdfUint8.byteOffset + pdfUint8.byteLength,
    ) as ArrayBuffer

    const safeName = (filename || 'quote-sheet.pdf')
      .replace(/[<>:"/\\|?*]/g, '_')
      .trim()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}"`,
      },
    })
  } catch (err) {
    console.error('[/api/pdf]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    )
  } finally {
    if (browser) await browser.close()
  }
}
