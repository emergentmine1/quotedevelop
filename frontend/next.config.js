const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: ['*.preview.emergentcf.cloud', '*.preview.emergentagent.com'],
};

module.exports = nextConfig;
