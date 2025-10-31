/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self';",
      "script-src 'self' https://www.googletagmanager.com;",
      "style-src 'self' https://fonts.googleapis.com;",
      "img-src 'self' data: https:;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://*.supabase.co;",
      "frame-ancestors 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "upgrade-insecure-requests;"
    ].join(' ')
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
]


const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint during builds
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ssqpfkiesxwnmphwyezb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add other Supabase hostnames if needed
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  env: {
    CUSTOM_ENV: process.env.CUSTOM_ENV,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
