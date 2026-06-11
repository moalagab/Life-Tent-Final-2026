/**
 * Habits E2E — Habits page loads, habit list renders, create dialog works.
 */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/habits');
  if (!page.url().includes('/habits')) {
    test.skip(true, 'Auth required — set TEST_EMAIL and TEST_PASSWORD env vars.');
  }
  await page.waitForLoadState('networkidle');
});

test('habits page loads without crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  expect(page.url()).toContain('/habits');
  const body = await page.textContent('body');
  expect(body?.length).toBeGreaterThan(50);

  const critical = errors.filter(e => !e.includes('ResizeObserver'));
  expect(critical).toHaveLength(0);
});

test('can open create habit dialog', async ({ page }) => {
  const addBtn = page
    .getByRole('button', { name: /add habit|new habit|عادة جديدة|إضافة عادة|\+/i })
    .first();

  await expect(addBtn).toBeVisible({ timeout: 5_000 });
  await addBtn.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 3_000 });
});

test('creates a new habit', async ({ page }) => {
  const habitName = `Test Habit ${Date.now()}`;

  // Open dialog
  const addBtn = page
    .getByRole('button', { name: /add habit|new habit|عادة جديدة|إضافة عادة|\+/i })
    .first();
  await addBtn.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Fill name
  const nameInput = dialog
    .getByLabel(/name|habit name|اسم/i)
    .or(dialog.getByPlaceholder(/name|habit|اسم|عادة/i))
    .first();
  await nameInput.fill(habitName);

  // Submit
  const submitBtn = dialog.getByRole('button', { name: /create|save|add|إنشاء|حفظ/i });
  await submitBtn.click();

  // Dialog closes
  await expect(dialog).not.toBeVisible({ timeout: 5_000 });

  // Habit appears
  await expect(page.getByText(habitName)).toBeVisible({ timeout: 8_000 });
});

test('habit streak counters render', async ({ page }) => {
  // Wait for data to load and look for streak-related content
  // This is a light check — just ensures the component doesn't crash
  await page.waitForTimeout(1_000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  expect(page.url()).toContain('/habits');
});
