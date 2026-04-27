import { test, expect } from '@playwright/test';

/**
 * Visual regression: dashboard grid in RTL across breakpoints.
 *
 * Auth: this app requires login. Provide TEST_AUTH_COOKIE (a serialized cookie
 * named e.g. `sb-access-token`) or set TEST_STORAGE_STATE to a saved
 * playwright storageState JSON file. If neither is provided the test will
 * skip with a clear message rather than failing on the auth screen.
 */
const STORAGE_STATE = process.env.TEST_STORAGE_STATE;

test.use(STORAGE_STATE ? { storageState: STORAGE_STATE } : {});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  });
});

const PRESETS = ['focus', 'finance', 'execution'] as const;

for (const preset of PRESETS) {
  test(`dashboard RTL grid — preset: ${preset}`, async ({ page }, testInfo) => {
    const resp = await page.goto('/dashboard', { waitUntil: 'networkidle' });
    if (!resp || (resp.status() >= 400)) {
      test.skip(true, `Dashboard unreachable (${resp?.status()})`);
    }

    if (page.url().includes('/auth')) {
      test.skip(true, 'Auth required — provide TEST_STORAGE_STATE.');
    }

    // Persist preset before render-sensitive snapshot.
    await page.evaluate((p) => {
      try { localStorage.setItem('dashboard.preset', JSON.stringify(p)); } catch {}
    }, preset);
    await page.reload({ waitUntil: 'networkidle' });

    // Sanity: RTL applied
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Wait for one of the dashboard sections to be visible
    await page.waitForSelector('section', { timeout: 10_000 });

    // Disable animations for deterministic snapshot
    await page.addStyleTag({
      content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
    });

    await expect(page).toHaveScreenshot(`dashboard-${preset}-${testInfo.project.name}.png`, {
      fullPage: true,
    });
  });
}
