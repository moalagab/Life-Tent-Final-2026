import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for RTL dashboard visual regression.
 * Run locally:
 *   bunx playwright install --with-deps
 *   BASE_URL=http://localhost:8080 bunx playwright test
 *
 * In CI, set BASE_URL to your deployed preview (or start `bun run dev`
 * via the `webServer` block below). Snapshots live next to the spec
 * under tests/visual/__screenshots__/.
 */
const baseURL = process.env.BASE_URL || 'http://localhost:8080';

export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  expect: {
    // Tolerant pixel diff — layout shifts are what we want to catch, not AA noise.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-rtl',  use: { ...devices['iPhone 13'],         locale: 'ar-SA' } },
    { name: 'tablet-rtl',  use: { ...devices['iPad (gen 7)'],      locale: 'ar-SA' } },
    { name: 'desktop-rtl', use: { viewport: { width: 1440, height: 900 }, locale: 'ar-SA' } },
  ],
  // Uncomment to auto-start dev server locally:
  // webServer: {
  //   command: 'bun run dev',
  //   url: baseURL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
