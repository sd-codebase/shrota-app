import { test, expect } from '@playwright/test';

test.describe('Books catalog', () => {
  test('catalog page lists books and links to slug-based detail pages', async ({ page }) => {
    await page.goto('/books');
    await expect(page.locator('h1')).toHaveText('Audiobooks');
    const firstCard = page.locator('a[href^="/book/"]').first();
    await expect(firstCard).toBeVisible();
    const href = await firstCard.getAttribute('href');
    expect(href).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/); // not a raw UUID
  });

  test('nav link goes to /books', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Books' }).click();
    await expect(page).toHaveURL(/\/books$/);
  });
});
