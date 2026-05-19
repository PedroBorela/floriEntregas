import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

function computeExpectedToken(): string {
  return createHmac('sha256', process.env.ANALYTICS_SESSION_SECRET!)
    .update('analytics-auth')
    .digest('hex')
}

function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get('analytics_session')?.value
  if (!cookie) return false
  return cookie === computeExpectedToken()
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isLoginPage = pathname === '/analytics/login'
  const isAuthAPI = pathname === '/api/analytics-auth'

  if (isAuthAPI) return NextResponse.next()

  if (isLoginPage) {
    if (isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/analytics', request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated(request)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/analytics/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/analytics(.*)', '/api/analytics(.*)'],
}
