/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['*.preview.emergentcf.cloud', '*.preview.emergentagent.com'],
};

module.exports = nextConfig;
