import { test, expect } from '@playwright/test';

test.describe('Blog (Журнал)', () => {
  test('завантажує сторінку та фільтрує за категорією', async ({ page }) => {
    await page.goto('/about');
    const main = page.getByRole('main');

    // Display-заголовок
    await expect(main.locator('h1').first()).toBeVisible();

    // Featured-стаття
    await expect(main.locator('article').first()).toBeVisible();

    // Категорії як pill-кнопки (скоуп в main, бо в Header теж є кнопки)
    const guidesBtn = main.getByRole('button', { name: /гайди|guides/i }).first();
    if (await guidesBtn.count()) {
      await guidesBtn.click();
      // Дочекатися reflow grid-у статей
      await expect(main.locator('article')).not.toHaveCount(0);
    }
  });

  test('перехід на окрему статтю', async ({ page }) => {
    await page.goto('/about');
    const main = page.getByRole('main');

    // Лінк на статтю має URL /uk/about/<slug> (не сама /uk/about)
    const articleLink = main.locator('a[href*="/about/"]:not([href$="/about"])').first();
    if (!(await articleLink.count())) {
      test.skip(true, 'No articles available');
      return;
    }

    await articleLink.click();
    await page.waitForURL(/\/about\/[a-z0-9-]+$/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
