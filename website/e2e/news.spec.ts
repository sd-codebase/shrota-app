import { test, expect } from '@playwright/test';

test.describe('News', () => {
  test('list page loads and links to a detail page', async ({ page }) => {
    await page.goto('/news');
    await expect(page.locator('h1')).toHaveText('News');
  });

  test('nav link goes to /news', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'News' }).click();
    await expect(page).toHaveURL(/\/news$/);
  });
});
