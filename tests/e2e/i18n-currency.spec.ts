import { test, expect } from '@playwright/test';

test.describe('Локалізація і валюти', () => {
  test('перемикання локалі через URL: uk → en', async ({ page }) => {
    await page.goto('/uk');
    await expect(
      page.getByRole('heading', { name: /виберіть напрям/i }).first()
    ).toBeVisible();

    await page.goto('/en');
    await expect(
      page.getByRole('heading', { name: /choose direction/i }).first()
    ).toBeVisible();
  });

  test('API курсів валют віддає коректні значення', async ({ request }) => {
    const res = await request.get('/api/currency');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('USD');
    expect(body).toHaveProperty('UAH');
    expect(body).toHaveProperty('EUR');
    expect(body.USD).toBe(1);
    expect(body.UAH).toBeGreaterThan(20);
    expect(body.UAH).toBeLessThan(100);
    expect(body.EUR).toBeGreaterThan(0.5);
    expect(body.EUR).toBeLessThan(1.5);
  });

  test('ціни товарів у каталозі містять символ валюти', async ({ page }) => {
    await page.goto('/uk/shop');

    const firstArticle = page.locator('article').first();
    await firstArticle.waitFor({ state: 'attached', timeout: 10_000 });
    await expect(firstArticle).toBeVisible();

    const text = await firstArticle.innerText();
    expect(text).toMatch(/[\d.,]+\s*(₴|\$|€)/);
  });

  test('ціни товарів у мобільному API містять числа', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.products ?? [];
    if (list.length === 0) {
      test.skip(true, 'Немає товарів у БД');
      return;
    }
    expect(typeof list[0].price).toBe('number');
    expect(list[0].price).toBeGreaterThan(0);
  });
});
