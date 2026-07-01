import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old /tailor/builder to canonical /tailor
  if (pathname === '/tailor/builder' || pathname.startsWith('/tailor/builder/')) {
    return NextResponse.redirect(new URL('/tailor', request.url))
  }

  if (pathname.startsWith('/onboarding')) {
    const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('better-auth.') || c.name.startsWith('__Secure-better-auth.'))
    if (!hasSession) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
