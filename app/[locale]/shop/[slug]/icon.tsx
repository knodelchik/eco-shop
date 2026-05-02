import { ImageResponse } from 'next/og';

// Edge runtime + Neon serverless = добре, але для простоти беремо node
export const runtime = 'nodejs';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Icon({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // Перша велика літера товару — простий фаворікон
  const letter = decodedSlug.charAt(0).toUpperCase() || 'E';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '30%',
          fontWeight: 'bold',
        }}
      >
        {letter}
      </div>
    ),
    { ...size }
  );
}
