import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Отримуємо курс валют від НБУ
    // next: { revalidate: 86400 } означає кешувати відповідь на 24 години
    const res = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json', {
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error('Failed to fetch rates');

    const data = await res.json();
    
    // Знаходимо курс USD та EUR
    const usdRate = data.find((r: any) => r.cc === 'USD')?.rate || 41.5;
    const eurRate = data.find((r: any) => r.cc === 'EUR')?.rate || 45.0;

    // Нам потрібні коефіцієнти відносно USD (бо в базі ціни в USD)
    // 1 USD = 1 USD
    // 1 USD = X UAH (курс НБУ)
    // 1 USD = Y EUR (usdRate / eurRate)

    const rates = {
      USD: 1,
      UAH: usdRate,
      EUR: usdRate / eurRate
    };

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Currency API Error:', error);
    // Фолбек, якщо API недоступне
    return NextResponse.json({
      USD: 1,
      UAH: 41.5,
      EUR: 0.92
    });
  }
}