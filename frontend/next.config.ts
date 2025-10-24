import type { NextConfig } from "next";

// Use static export only for production builds
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Only use static export for production (Cloudflare Pages)
  // For development, use regular Next.js with rewrites
  ...(isProduction && { output: 'export' }),
  
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Rewrites work in development mode
  ...(!isProduction && {
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
  }),
};

export default nextConfig;
