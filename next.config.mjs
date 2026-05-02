import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // У продакшені прибираємо всі console.* (крім error/warn)
  // — додатковий розмір бандла + менше шуму у браузері.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/c',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/about',
        permanent: true,
      },
    ];
  },
  /**
   * CORS-заголовки для /api/* — потрібні щоб мобільний клієнт
   * (eco-shop-mobile на Expo) міг звертатись до API з іншого origin.
   * Браузерний веб-клієнт працює через cookies на тому ж origin
   * і CORS йому не потрібен.
   */
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
