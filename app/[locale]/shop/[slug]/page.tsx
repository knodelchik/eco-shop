import { productsService } from '../../services/productService';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

// Функція для нормалізації рядків при порівнянні
function normalizeSlug(text: string) {
  return text.replace(/\s+/g, '-').toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // 1. Декодуємо URL (hinge-360%C2%B0 -> hinge-360°)
  const decodedSlug = decodeURIComponent(slug);

  const products = await productsService.getAllProducts();
  const product = products.find(
    (p) => normalizeSlug(p.title) === decodedSlug
  );

  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title} | EcoShop`,
    description:
      product.description?.slice(0, 160) || 'Eco-friendly goods at EcoShop',
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  // 1. Декодуємо URL
  const decodedSlug = decodeURIComponent(slug);

  const products = await productsService.getAllProducts();

  // 2. Шукаємо продукт за декодованим слагом
  const product = products.find(
    (p) => normalizeSlug(p.title) === decodedSlug
  );

  if (!product) {
    notFound();
  }

  // JSON-LD structured data для SEO
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ecoshop.com';
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    description: product.description || 'Eco-friendly product',
    brand: { '@type': 'Brand', name: 'EcoShop' },
    sku: String(product.id),
    image: product.images?.[0] || `${baseUrl}/icon.png`,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/shop/${decodedSlug}`,
      priceCurrency: 'USD',
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient product={product} />
    </>
  );
}