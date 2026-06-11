import { defineConfig, devices } from '@playwright/test';

/**
 * E2E functional tests — auth flows, CRUD operations, navigation.
 *
 * Run locally:
 *   npx playwright install --with-deps
 *   BASE_URL=http://localhost:8080 npx playwright test --config playwright.e2e.config.ts
 *
 * For protected-route tests, save auth state first:
 *   npx playwright test --config playwright.e2e.config.ts --project=setup
 * then run the full suite.
 */

const baseURL = process.env.BASE_URL || 'http://localhost:8080';
const storageState = 'tests/e2e/.auth/user.json';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // auth state needs sequential setup
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-e2e' }]],

  use: {
    baseURL,
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // 1. Setup: save auth state to file
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    // 2. Desktop E2E (depends on auth setup)
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], storageState },
      dependencies: ['setup'],
    },
    // 3. Mobile E2E
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], storageState, locale: 'ar-SA' },
      dependencies: ['setup'],
    },
  ],

  webServer: process.env.START_SERVER ? {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  } : undefined,
});
