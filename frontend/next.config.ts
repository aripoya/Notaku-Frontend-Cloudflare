import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static export for Cloudflare Pages
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Note: rewrites() doesn't work with static export
  // API calls will need to use full URLs or environment variables
};

export default nextConfig;
