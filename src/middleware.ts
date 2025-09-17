import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Security headers for all responses
  const response = NextResponse.next();
  
  // Get the origin of the request to check if it's from k9apparel.com
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  
  // Check if request is from k9apparel.com domain
  const isFromK9Apparel = 
    origin.includes('k9apparel.com') || 
    referer.includes('k9apparel.com') ||
    request.nextUrl.searchParams.get('embedded') === 'true';
  
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Set frame options based on origin
  if (isFromK9Apparel) {
    // Allow embedding from k9apparel.com
    response.headers.set('X-Frame-Options', 'ALLOWALL');
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://k9apparel.com https://*.k9apparel.com;"
    );
    
    // Add CORS headers for k9apparel.com
    response.headers.set('Access-Control-Allow-Origin', 'https://k9apparel.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // Default: deny framing for other domains
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self';"
    );
  }
  
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