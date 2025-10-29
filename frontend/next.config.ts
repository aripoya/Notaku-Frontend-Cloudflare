import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⚠️ REMOVED: output: 'export' to support NextAuth API routes
  // NextAuth requires server-side API routes which are not available in static export
  // This app now uses Cloudflare Workers/Functions instead of static Pages
  
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Rewrites for development
  async rewrites() {
    const ocrBackendUrl = process.env.OCR_BACKEND_URL || 'http://localhost:8001';
    return [
      {
        source: '/api/ocr/:path*',
        destination: `${ocrBackendUrl}/api/v1/ocr/:path*`,
      },
      {
        source: '/api/ocr-health',
        destination: `${ocrBackendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
