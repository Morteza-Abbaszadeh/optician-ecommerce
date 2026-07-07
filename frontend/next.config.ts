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
      // این یکی را هم نگه دارید تا عکس‌های تستی قبلی (Unsplash) خراب نشوند
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', 
      }
    ],
  },
};

module.exports = nextConfig;