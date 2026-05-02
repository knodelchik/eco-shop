import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Цей файл був потрібен для Fondy.
  // Monobank і PayPal використовують прямий редірект на фронтенд.
  // Залишаємо цей код як "запасний вихід", щоб не було помилки 404.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  return NextResponse.redirect(`${baseUrl}/order/result`, 303);
}

export async function GET(req: Request) {
  // Те саме для GET запитів
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  return NextResponse.redirect(`${baseUrl}/order/result`, 303);
}
