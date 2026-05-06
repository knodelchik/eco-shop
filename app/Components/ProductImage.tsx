'use client';

/**
 * ProductImage — єдиний компонент для зображення товару у каталозі/деталі.
 *
 * Логіка:
 *   1. Якщо у товара є images[i] → рендеримо next/image з ним.
 *   2. Якщо немає або трапився onError → показуємо category-градієнт як fallback
 *      (раніше веб всюди рендерив тільки градієнти — лишаємо їх як safety net,
 *       щоб порожніх блоків не було).
 *
 * Використання — у FeaturedProducts, ShopClient (картка), ProductClient
 * (main + thumbnails).
 */
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ProductCategory } from '@/app/types/products';

const CATEGORY_BG: Record<string, string> = {
  sharpeners: 'linear-gradient(160deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 130%)',
  stones: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.55 0.13 150) 130%)',
  accessories: 'linear-gradient(140deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)',
};

interface ProductImageProps {
  src?: string | null;
  alt: string;
  category?: ProductCategory | string;
  /** Hue-rotate у градусах для thumbnails-варіацій коли реальної картинки нема. */
  hueRotate?: number;
  /** sizes для responsive next/image. */
  sizes?: string;
  /** Якщо true — не ставимо next/image priority (default false). */
  priority?: boolean;
  className?: string;
}

export function ProductImage({
  src,
  alt,
  category,
  hueRotate,
  sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  priority,
  className,
}: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  const fallbackStyle = useMemo(() => {
    const bg = CATEGORY_BG[category ?? 'accessories'] ?? CATEGORY_BG.accessories;
    return {
      background: bg,
      filter: hueRotate ? `hue-rotate(${hueRotate}deg)` : undefined,
    };
  }, [category, hueRotate]);

  const showImage = Boolean(src) && !errored;

  return (
    <div className={`relative w-full h-full ${className ?? ''}`} style={!showImage ? fallbackStyle : undefined}>
      {showImage && (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setErrored(true)}
          className="object-cover"
        />
      )}
    </div>
  );
}
