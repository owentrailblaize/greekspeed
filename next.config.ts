/** @type {import('next').NextConfig} */
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
};

export default nextConfig;
