import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ONBOARDING_ROUTE = '/onboarding'
const SKIP_ONBOARDING_CHECK = ['/tailor', '/dashboard', '/history']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old /tailor/builder to canonical /tailor
  if (pathname === '/tailor/builder' || pathname.startsWith('/tailor/builder/')) {
    return NextResponse.redirect(new URL('/tailor', request.url))
  }

  // Public routes that never require auth
  if (
    pathname === '/' ||
    pathname === '/sign-in' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Any /api/* route that isn't /api/auth/* requires auth — handled by backend
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  if (pathname.startsWith(ONBOARDING_ROUTE)) {
    const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('better-auth.') || c.name.startsWith('__Secure-better-auth.'))
    if (!hasSession) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Routes that should bypass onboarding check (user may have history data)
  if (SKIP_ONBOARDING_CHECK.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const hasCompletedOnboarding = request.cookies.get('onboarding_complete')?.value === 'true'

  if (!hasCompletedOnboarding) {
    return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
