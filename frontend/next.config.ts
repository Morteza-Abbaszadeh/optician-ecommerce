/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
      // برای زمانی که پروژه روی دامنه واقعی رفت:
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_IMAGE_DOMAIN || 'api.yourdomain.com', 
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', 
      }
    ],
  },
};

module.exports = nextConfig;