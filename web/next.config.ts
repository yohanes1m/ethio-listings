import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output for self-hosted (Railway/Docker); Vercel handles this natively
  ...(process.env.STANDALONE_OUTPUT === '1' ? { output: 'standalone' } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
