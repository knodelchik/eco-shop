import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nekrasovss@gmail.com';

const transporter = process.env.GMAIL_USER
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD },
    })
  : null;

export async function POST(req: Request) {
  try {
    const { rating, feedback, pageUrl, name, email } = await req.json();

    try {
      // У нашій таблиці feedback колонки: name, email, subject, message
      await sql`
        INSERT INTO feedback (name, email, subject, message)
        VALUES (
          ${name ?? 'Anonymous'},
          ${email ?? ''},
          ${`Feedback ${rating}/4 — ${pageUrl ?? ''}`},
          ${feedback ?? ''}
        )
      `;
    } catch (dbError) {
      console.error('Feedback DB error:', dbError);
    }

    const emojis = ['😢', '🙁', '🙂', '🤩'];
    const selectedEmoji = emojis[rating - 1] || '🤔';

    const userInfoHtml = email
      ? `<p><strong>Користувач:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>`
      : `<p><strong>Користувач:</strong> Анонім</p>`;

    if (transporter) {
      try {
        await transporter.sendMail({
          to: ADMIN_EMAIL,
          from: `"EcoShop Feedback" <${process.env.GMAIL_USER}>`,
          replyTo: email || undefined,
          subject: `Новий відгук ${selectedEmoji} (Оцінка: ${rating}/4)`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2>Новий фідбек з сайту</h2>
              <div style="background-color: #D8F3DC; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                ${userInfoHtml}
                <p><strong>Оцінка:</strong> ${rating} / 4 ${selectedEmoji}</p>
                <p><strong>Сторінка:</strong> <a href="${pageUrl}">${pageUrl}</a></p>
              </div>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <h3>Коментар:</h3>
              <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; font-style: italic;">
                ${feedback || 'Без текстового коментаря'}
              </p>
            </div>`,
        });
      } catch (mailError) {
        console.warn('Feedback mail send failed (saved OK):', mailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
