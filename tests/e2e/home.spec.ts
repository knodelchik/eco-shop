import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('завантажує всі ключові секції', async ({ page }) => {
    await page.goto('/');
    const main = page.getByRole('main');

    // Hero — h1
    await expect(main.locator('h1').first()).toBeVisible();

    // Categories section — реальний заголовок це "Виберіть напрям" / "Choose direction"
    await expect(
      main.getByRole('heading', { name: /виберіть напрям|choose direction/i })
    ).toBeVisible();

    // Featured products — "Вибір редакції" / "Editor's pick"
    await expect(
      main.getByRole('heading', { name: /вибір редакції|editor.?s pick/i })
    ).toBeVisible();

    // Story section — "Менше речей" / "Fewer things"
    await expect(
      main.getByRole('heading', { name: /менше речей|fewer things/i })
    ).toBeVisible();

    // Footer
    await expect(page.locator('footer')).toBeVisible();
  });

  test('перехід з hero у магазин', async ({ page }) => {
    await page.goto('/');

    // Беремо CTA-кнопку з main, не з Header
    const cta = page
      .getByRole('main')
      .getByRole('link', { name: /магазин|shop/i })
      .first();
    await cta.click();

    await expect(page).toHaveURL(/\/shop$/);
    await expect(
      page.getByRole('heading', { name: /усі товари|all products/i })
    ).toBeVisible();
  });
});
