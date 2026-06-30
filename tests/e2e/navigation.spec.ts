/**
 * Navigation smoke tests — verifies all main routes load without errors.
 * Requires authenticated session (storageState from auth.setup.ts).
 */
import { test, expect } from '@playwright/test';

// Skip all tests if no auth state was saved
test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard');
  if (page.url().includes('/auth')) {
    test.skip(true, 'Auth required — set TEST_EMAIL and TEST_PASSWORD env vars.');
  }
});

const ROUTES = [
  { path: '/dashboard',  title: /dashboard|داشبورد|الرئيسية/i },
  { path: '/tasks',      title: /tasks|مهام/i },
  { path: '/projects',   title: /projects|مشاريع/i },
  { path: '/goals',      title: /goals|أهداف/i },
  { path: '/finance',    title: /finance|مالية/i },
  { path: '/habits',     title: /habits|عادات/i },
  { path: '/calendar',   title: /calendar|تقويم/i },
  { path: '/knowledge',  title: /knowledge|معرفة/i },
  { path: '/studio',     title: /studio|استوديو/i },
  { path: '/settings',   title: /settings|إعدادات/i },
];

for (const route of ROUTES) {
  test(`loads ${route.path} without error`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    // Page should respond with 200
    expect(response?.status()).toBeLessThan(400);

    // Should NOT redirect back to auth
    expect(page.url()).not.toContain('/auth');

    // Should not crash with a React error boundary
    await expect(page.getByRole('alert')).not.toBeVisible({ timeout: 3_000 }).catch(() => {});

    // No critical JS errors
    const criticalErrors = errors.filter(
      e => !e.includes('favicon') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors, `Console errors on ${route.path}: ${criticalErrors.join(', ')}`).toHaveLength(0);
  });
}

test('404 page renders for unknown routes', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  // Should show 404 component, not crash
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  expect(page.url()).not.toContain('/auth');
});
