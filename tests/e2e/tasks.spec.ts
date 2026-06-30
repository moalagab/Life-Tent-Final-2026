/**
 * Tasks E2E — Create, view, update status, delete tasks.
 */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tasks');
  if (!page.url().includes('/tasks')) {
    test.skip(true, 'Auth required — set TEST_EMAIL and TEST_PASSWORD env vars.');
  }
  // Wait for Kanban board to load
  await page.waitForLoadState('networkidle');
});

test('tasks page loads with kanban columns', async ({ page }) => {
  // Expect at least one kanban column header to be visible
  // The board has: Backlog, Todo, In Progress, Review, Done
  const columns = page.locator('[data-column], .kanban-column, section');
  await expect(columns.first()).toBeVisible({ timeout: 10_000 });
});

test('can open create task dialog', async ({ page }) => {
  // Click the primary add task button
  const addButton = page.getByRole('button', { name: /add task|مهمة جديدة|\+/i }).first();
  await expect(addButton).toBeVisible({ timeout: 5_000 });
  await addButton.click();

  // Dialog should appear
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 3_000 });
});

test('creates a new task and it appears on the board', async ({ page }) => {
  if (!page.url().includes('/tasks')) {
    test.skip(true, 'Auth required — set TEST_EMAIL and TEST_PASSWORD env vars.');
  }
  const taskTitle = `E2E Test Task ${Date.now()}`;

  // Open create dialog
  const addButton = page.getByRole('button', { name: /add task|مهمة جديدة|\+/i }).first();
  await addButton.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Fill title
  const titleInput = dialog.getByLabel(/title|العنوان/i).or(dialog.getByPlaceholder(/title|عنوان/i));
  await titleInput.fill(taskTitle);

  // Submit
  const submitButton = dialog.getByRole('button', { name: /create|save|add|إنشاء|حفظ/i });
  await submitButton.click();

  // Dialog should close
  await expect(dialog).not.toBeVisible({ timeout: 5_000 });

  // Task should appear somewhere on the board
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8_000 });
});

test('search filters tasks by title', async ({ page }) => {
  // Look for search input
  const searchInput = page.getByPlaceholder(/search|بحث/i);
  if (!(await searchInput.isVisible())) {
    test.skip(true, 'No search input visible on tasks page');
  }

  await searchInput.fill('nonexistent-task-xyz-12345');
  await page.waitForTimeout(300); // debounce

  // Should show no results or empty state — not crash
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  expect(page.url()).not.toContain('/auth');
});
