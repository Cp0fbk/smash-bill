import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output:
    process.env.NEXT_STANDALONE === 'true' || process.platform !== 'win32'
      ? 'standalone'
      : undefined,
  reactStrictMode: true,
  transpilePackages: ['@smash-bill/shared'],
};

export default nextConfig;
