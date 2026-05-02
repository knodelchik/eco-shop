import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('сторінка signin містить форму', async ({ page }) => {
    await page.goto('/auth?view=signin');
    const main = page.getByRole('main');

    await expect(main.locator('input[type="email"]')).toBeVisible();
    await expect(main.locator('input[type="password"]')).toBeVisible();
    // Кнопка submit-форми (у Header є логін-іконка, тому скоупимо в main)
    await expect(
      main.getByRole('button', { name: /увійти|sign in/i })
    ).toBeVisible();
  });

  test('toggle між signin та signup', async ({ page }) => {
    await page.goto('/auth?view=signin');
    const main = page.getByRole('main');

    const toggle = main.getByRole('button', { name: /немає акаунту|don.?t have/i });
    if (await toggle.count()) {
      await toggle.click();
      await expect(main.locator('input[name="full_name"]')).toBeVisible();
    }
  });

  test('forgot password перехід', async ({ page }) => {
    await page.goto('/auth?view=signin');
    const main = page.getByRole('main');

    const forgot = main.getByRole('button', { name: /забули пароль|forgot/i });
    if (await forgot.count()) {
      await forgot.click();
      // Має лишитись email-поле (форма відновлення)
      await expect(main.locator('input[type="email"]')).toBeVisible();
    }
  });
});
