import { test, expect } from '@playwright/test';

/**
 * Visual regression — LIGHT theme.
 * Targets: full Dashboard, KPI strip, Today's Rhythm widgets group.
 *
 * Only runs against `*-light` projects (see playwright.config.ts).
 * Auth: provide TEST_STORAGE_STATE for an authed session, otherwise the test
 * skips with a clear message instead of snapshotting the auth screen.
 */
const STORAGE_STATE = process.env.TEST_STORAGE_STATE;
test.use(STORAGE_STATE ? { storageState: STORAGE_STATE } : {});

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(
    !testInfo.project.name.endsWith('-light'),
    'Light-theme spec — runs only on *-light projects'
  );
  await page.addInitScript(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    // Force light theme regardless of system preference / persisted choice
    document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('vite-ui-theme', 'light');
    } catch {}
  });
});

async function gotoDashboard(page: import('@playwright/test').Page) {
  const resp = await page.goto('/dashboard', { waitUntil: 'networkidle' });
  if (!resp || resp.status() >= 400) test.skip(true, `Dashboard unreachable (${resp?.status()})`);
  if (page.url().includes('/auth')) test.skip(true, 'Auth required — provide TEST_STORAGE_STATE.');

  // Hard-disable animations for stable pixel diffs
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
  });
  await page.waitForSelector('section', { timeout: 10_000 });
}

test('light · dashboard — full page', async ({ page }, testInfo) => {
  await gotoDashboard(page);
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page).toHaveScreenshot(`light-dashboard-${testInfo.project.name}.png`, {
    fullPage: true,
  });
});

test('light · KPI strip', async ({ page }, testInfo) => {
  await gotoDashboard(page);
  // KPI strip lives in the first <section> (Overview)
  const kpi = page.locator('section').first();
  await expect(kpi).toBeVisible();
  await expect(kpi).toHaveScreenshot(`light-kpi-strip-${testInfo.project.name}.png`);
});

test('light · widgets — today\u2019s rhythm grid', async ({ page }, testInfo) => {
  await gotoDashboard(page);
  // Today's Rhythm = the section that contains the prayer/habit/goal grid
  const sections = page.locator('section');
  const count = await sections.count();
  let target = sections.first();
  for (let i = 0; i < count; i++) {
    const s = sections.nth(i);
    const hasGrid = await s.locator('.grid').count();
    if (hasGrid) { target = s; break; }
  }
  await expect(target).toHaveScreenshot(`light-widgets-${testInfo.project.name}.png`);
});
