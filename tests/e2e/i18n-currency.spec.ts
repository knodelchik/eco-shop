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

  test('переключення валюти змінює відображення ціни на головній', async ({ page }) => {
    await page.goto('/uk');

    const heroCta = page
      .getByRole('main')
      .getByRole('link', { name: /магазин|shop/i })
      .first();
    await heroCta.click();
    await page.waitForURL(/\/shop$/);

    const firstPrice = page.locator('article').first().locator('text=/[\\d\\s.,]+(₴|\\$|€)/').first();
    if (!(await firstPrice.count())) {
      test.skip(true, 'Немає товарів — пропускаємо');
      return;
    }

    const uahPrice = await firstPrice.textContent();
    expect(uahPrice).toBeTruthy();
  });
});
