import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build-time optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production for security
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'nodemailer'],

  // Allow images from Appwrite storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sfo.cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
    ],
    // Cache images for 1 day
    minimumCacheTTL: 86400,
  },

  // Trailing slashes for consistent URLs
  trailingSlash: false,

  // Performance optimizations
  compress: true,

  // Security headers + allow Appwrite cross-origin requests
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          // Caching headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      // Disable caching for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.googledev-drive.vercel.app',
          },
        ],
        destination: 'https://googledev-drive.vercel.app/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
