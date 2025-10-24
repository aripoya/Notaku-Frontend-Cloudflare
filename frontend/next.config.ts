import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/ocr/:path*',
        destination: 'http://172.16.1.7:8001/api/v1/ocr/:path*',
      },
      {
        source: '/api/ocr-health',
        destination: 'http://172.16.1.7:8001/health',
      },
    ];
  },
};

export default nextConfig;
