import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'qsp_auth'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass through login, auth API, and static assets without checking
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) {
    // No password configured — open access
    return NextResponse.next()
  }

  const cookieToken = request.cookies.get(COOKIE_NAME)?.value
  if (cookieToken) {
    const expected = await hashPassword(appPassword)
    if (cookieToken === expected) {
      return NextResponse.next()
    }
  }

  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
