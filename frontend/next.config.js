const path = require('path')

module.exports = {
  transpilePackages: ['@react-three/fiber', '@react-three/xr', 'three', '@iwer/devui'],
  experimental: {
    serverActions: true
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}
