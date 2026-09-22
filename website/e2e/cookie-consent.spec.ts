import { test, expect } from '@playwright/test';

test.describe('Cookie consent', () => {
  test('shows on first visit and Accept All persists across reload', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Cookie preferences' });
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: 'Accept All' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(dialog).toBeHidden();
  });

  test('Reject All stores non-necessary categories as false', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reject All' }).click();
    const stored = await page.evaluate(() => localStorage.getItem('shrota_cookie_consent'));
    const consent = JSON.parse(stored!);
    expect(consent.necessary).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.preferences).toBe(false);
  });

  test('Manage preferences allows a partial choice', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Manage preferences' }).click();
    await page.getByRole('switch', { name: 'Analytics' }).click();
    await page.getByRole('button', { name: 'Confirm My Choices' }).click();

    const stored = await page.evaluate(() => localStorage.getItem('shrota_cookie_consent'));
    const consent = JSON.parse(stored!);
    expect(consent.analytics).toBe(true);
    expect(consent.preferences).toBe(false);
  });
});
