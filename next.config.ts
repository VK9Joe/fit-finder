import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '*.myshopify.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 75, 90, 100], // Required for Next.js 16
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Allow iframe embedding from k9apparel.com
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow all domains to frame this content
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://k9apparel.com https://*.k9apparel.com;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Special iframe-specific route with more permissive settings
      {
        source: '/iframe/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // More restrictive for iframe-specific routes
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://k9apparel.com https://*.k9apparel.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;