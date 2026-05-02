import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import nodemailer from 'nodemailer';

const transporter = process.env.GMAIL_USER
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD },
    })
  : null;

export async function POST(req: Request) {
  try {
    const { email, lang = 'en' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    try {
      await sql`
        INSERT INTO newsletter (email)
        VALUES (${email})
        ON CONFLICT (email) DO NOTHING
      `;
    } catch (dbError) {
      console.error('Newsletter DB error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const isUk = lang === 'uk';
    const subject = isUk ? 'Вітаємо в EcoShop!' : 'Welcome to EcoShop!';
    const title = isUk ? 'Дякуємо за підписку! 🌱' : 'Thanks for subscribing! 🌱';
    const textMain = isUk
      ? 'Ви успішно підписалися на новини <strong>EcoShop</strong>.'
      : 'You have successfully subscribed to <strong>EcoShop</strong> news.';
    const textSub = isUk
      ? 'Ми ділитимемося новими еко-товарами, акціями та порадами щодо свідомого життя.'
      : 'We will share new eco products, promotions, and tips for conscious living.';
    const footer = isUk
      ? 'З найкращими побажаннями,<br/>Команда EcoShop'
      : 'Best regards,<br/>EcoShop Team';

    if (transporter) {
      try {
        await transporter.sendMail({
          to: email,
          from: `"EcoShop" <${process.env.GMAIL_USER}>`,
          subject,
          html: `
            <div style="font-family: sans-serif; color: #1B4332; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2D6A4F;">${title}</h1>
              <p>${textMain}</p>
              <p>${textSub}</p>
              <br />
              <p>${footer}</p>
            </div>`,
        });
      } catch (mailError) {
        console.warn('Newsletter mail send failed (subscribed OK):', mailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
