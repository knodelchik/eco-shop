/**
 * Neon Postgres клієнт для прямих SQL-запитів через HTTP.
 *
 * SERVER-ONLY: цей файл забороняється імпортувати з клієнтських компонентів.
 * Якщо клієнту потрібні дані — створіть API-route і робіть `fetch('/api/...')`.
 *
 * Приклади використання (server components, route handlers, server actions):
 *   import { sql } from '@/lib/neon-db';
 *   const products = await sql`SELECT * FROM products`;
 */
import 'server-only';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing in .env.local');
}

export const sql = neon(process.env.DATABASE_URL);
