import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Security headers for all responses
  const response = NextResponse.next();
  
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Protect sensitive API routes
  if (request.nextUrl.pathname.startsWith('/api/patterns')) {
    // Add additional rate limiting headers
    response.headers.set('X-RateLimit-Limit', '10');
    response.headers.set('X-RateLimit-Window', '60');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/:path*',
  ],
};
