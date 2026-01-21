import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check for Appwrite's session cookie
  const sessionCookieName = `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  const hasSession = request.cookies.get(sessionCookieName);
  
  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/signin') || 
      request.nextUrl.pathname.startsWith('/signup')) {
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
