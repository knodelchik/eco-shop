import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EcoShop — Магазин еко-товарів',
    short_name: 'EcoShop',
    description:
      'Натуральні, біорозкладні та багаторазові товари для свідомого життя.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBFAF5',
    theme_color: '#2D6A4F',
    lang: 'uk',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
