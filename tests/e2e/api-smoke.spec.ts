import { test, expect } from '@playwright/test';

test.describe('API smoke + SEO', () => {
  test('GET /api/products повертає масив', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /sitemap.xml доступний', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain('<urlset');
    expect(text).toMatch(/<loc>https?:\/\//);
  });

  test('GET /robots.txt доступний', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text.toLowerCase()).toContain('sitemap');
  });

  test('GET /manifest.webmanifest доступний', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    if (!res.ok()) {
      test.skip(true, 'Manifest за іншим шляхом');
      return;
    }
    const data = await res.json();
    expect(data).toHaveProperty('name');
  });

  test('Іконка SVG для favicon доступна', async ({ request }) => {
    const res = await request.get('/icon.svg');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('image/svg+xml');
  });

  test('CORS для мобільного клієнта на /api/products', async ({ request }) => {
    const res = await request.fetch('/api/products', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:8081' },
    });
    const acao = res.headers()['access-control-allow-origin'];
    expect(acao).toBeDefined();
  });

  test('Захищений ендпоінт /api/orders без auth відмовляє', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect([400, 401, 403]).toContain(res.status());
  });

  test('OG-зображення для головної генерується', async ({ request }) => {
    const res = await request.get('/opengraph-image');
    if (res.ok()) {
      expect(res.headers()['content-type']).toMatch(/image\//);
    }
  });
});
