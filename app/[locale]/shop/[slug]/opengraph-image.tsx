import { ImageResponse } from 'next/og';
import { sql } from '@/lib/neon-db';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'EcoShop Product';

type Props = { params: Promise<{ slug: string }> };

function normalizeSlug(text: string) {
  return text.replace(/\s+/g, '-').toLowerCase();
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let title = 'EcoShop';
  let price = '';
  let imageUrl: string | null = null;

  try {
    const rows = await sql`SELECT title, price, images FROM products`;
    const products = rows as Record<string, unknown>[];
    const product = products.find((p) => normalizeSlug(String(p.title)) === decodedSlug);
    if (product) {
      title = String(product.title);
      price = `${Number(product.price)} $`;
      const imgs = Array.isArray(product.images) ? (product.images as string[]) : [];
      imageUrl = imgs.length > 0 ? imgs[0] : null;
    }
  } catch (e) {
    console.warn('OG image: failed to fetch product', e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FBFAF5 0%, #D8F3DC 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '40px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{
          display: 'flex',
          width: '50%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
        }}>
          {imageUrl ? (
             
            <img src={imageUrl} alt={title} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
          ) : (
            <div style={{ fontSize: 80 }}>🌿</div>
          )}
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '50%',
          height: '100%',
          paddingLeft: '40px',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 24, color: '#52B788', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            EcoShop
          </div>
          <div style={{ fontSize: 52, fontWeight: 'bold', color: '#1B4332', marginBottom: '20px', lineHeight: 1.1 }}>
            {title}
          </div>
          {price && (
            <div style={{
              fontSize: 48,
              color: 'white',
              background: '#2D6A4F',
              padding: '10px 24px',
              borderRadius: '50px',
              alignSelf: 'flex-start',
              fontWeight: 'bold',
              marginTop: '10px',
            }}>
              {price}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
