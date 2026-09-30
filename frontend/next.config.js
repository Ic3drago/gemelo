/** @type {import('next').NextConfig} */

// `standalone` is required in both places. The Docker images copy
// .next/standalone into the runtime stage, and Vercel serves the build from
// the same directory. Disabling it on Vercel left the CSS and JS chunks
// outside the served tree, so every asset 404'd and the page rendered with no
// styles before the client threw.
const nextConfig = {
  output: 'standalone',
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
