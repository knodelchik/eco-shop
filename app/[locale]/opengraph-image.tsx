import { ImageResponse } from 'next/og';
import { join } from 'path';
import { readFileSync } from 'fs';

// ВАЖЛИВО: Змінюємо середовище на nodejs, щоб обійти ліміт 1MB
export const runtime = 'nodejs';

export const alt = 'EcoShop — Eco-friendly Goods Store';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // В середовищі Node.js ми можемо читати файл прямо з диска через fs
  // process.cwd() вказує на корінь проекту
  const filePath = join(process.cwd(), 'public', 'icon.png');
  const iconData = readFileSync(filePath);

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Логотип */}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          // @ts-ignore
          src={iconData.buffer}
          width="220"
          height="220"
          style={{
            objectFit: 'cover',
            borderRadius: '50%',
            marginBottom: 30,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        />

        {/* Текст */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            marginBottom: 15,
            textAlign: 'center',
          }}
        >
          ECOSHOP
        </div>

        <div
          style={{
            fontSize: 32,
            opacity: 0.85,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          Eco-friendly Goods Store
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
