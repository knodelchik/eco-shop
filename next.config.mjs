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
   * CORS-заголовки для /api/*. Мобільний клієнт (Expo) має `Origin`
   * відсутній або `null` — браузер це дозволяє і без CORS, але fetch з
   * web-сторінок іншого домену тепер блокується (раніше було `*`).
   *
   * Якщо у майбутньому хочеш дозволити власний public API — додай
   * referer-перевірку у конкретні route handlers замість CORS-allowlist.
   */
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // Vercel-домен достатньо. Експо-сесія без Origin не блокується.
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://eco-shop-psi.vercel.app',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
