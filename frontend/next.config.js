/** @type {import('next').NextConfig} */

// `standalone` is only needed by the Docker images (they copy
// .next/standalone into the runtime stage). On Vercel the platform builds
// and runs Next.js itself, and standalone output only confuses its builder,
// so we disable it there.
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=self, microphone=()' },
          { key: 'X-DNS-Prefetch-Control',   value: 'on' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },

  // Allow external images if needed in future
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
