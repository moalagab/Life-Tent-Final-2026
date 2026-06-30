/**
 * Auth setup — logs in once and saves browser state so all E2E tests
 * can reuse the session without repeating the login flow.
 *
 * Requires environment variables:
 *   TEST_EMAIL=your-test@email.com
 *   TEST_PASSWORD=your-test-password
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  TEST_EMAIL / TEST_PASSWORD not set — skipping auth setup.');
    // Write empty state so dependent tests can still run (they will skip themselves)
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  await page.goto('/auth');

  // Fill login form
  await page.getByRole('tab', { name: /sign in|تسجيل الدخول/i }).click().catch(() => {});
  await page.getByLabel(/email|البريد/i).fill(email);
  await page.getByLabel(/password|كلمة المرور/i).fill(password);
  await page.getByRole('button', { name: /sign in|تسجيل الدخول/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page).toHaveURL(/dashboard/);

  // Save auth state
  await page.context().storageState({ path: AUTH_FILE });
  console.log('✅ Auth state saved to', AUTH_FILE);
});
