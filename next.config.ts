import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Turbopack instead of webpack
  turbopack: {}, // Enable Turbopack
  
  // External packages for server components
  serverExternalPackages: ['pdf2pic', 'sharp', 'playwright-core', 'playwright'],
  
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
