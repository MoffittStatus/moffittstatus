const path = require('path')

module.exports = {
  transpilePackages: ['@react-three/fiber', '@react-three/xr', 'three', '@iwer/devui'],
  experimental: {
    serverActions: true,
    staleTimes: {
      dynamic: 0, // Force Next.js router to always fetch fresh page data when navigating
    },
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // In production server.js handles /api itself. In dev, Google's registered redirect URI points at this port.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    return [{ source: '/api/auth/callback/google', destination: `${backendUrl}/api/auth/callback/google` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.lib.berkeley.edu',
        pathname: '/**',
      },
    ],
  },
}
