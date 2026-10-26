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
