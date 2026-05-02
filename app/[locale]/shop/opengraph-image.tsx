import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'EcoShop Catalog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: '#1a1a1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        🛒 EcoShop Catalog
      </div>
    ),
    { ...size }
  );
}