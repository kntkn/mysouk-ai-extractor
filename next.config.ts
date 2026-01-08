import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable app router
    appDir: true,
    // Allow external packages for server components
    serverComponentsExternalPackages: ['pdf2pic', 'sharp'],
  },
  
  // Configure webpack for pdf2pic compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow external packages that might not be bundled properly
      config.externals.push({
        'canvas': 'canvas',
        'pdf2pic': 'pdf2pic'
      });
    }
    
    // Handle pdf2pic binary paths
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      child_process: false,
    };
    
    return config;
  },
  
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
