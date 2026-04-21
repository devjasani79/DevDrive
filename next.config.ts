import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  // Correct: Moved out of experimental and renamed for Next.js 15/16
  serverExternalPackages: ['pdf-parse', 'nodemailer'],

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
    minimumCacheTTL: 86400,
  },

  trailingSlash: false,
  compress: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/share/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.googledev-drive.vercel.app' }],
        destination: 'https://googledev-drive.vercel.app/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
