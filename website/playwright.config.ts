import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e config for the Shrota website.
 * Run against the local dev/docker server (defaults to http://localhost:3001).
 *
 *   npm run test:e2e          # headless
 *   npm run test:e2e:headed   # headed (visible browser)
 *   npm run test:e2e:ui       # interactive UI mode
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
