import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Set sail.' })).toBeVisible();
  await page.getByText('Network scenarios').click();
  await page.getByRole('button', { name: 'Reset network data and records' }).click();
});

test('options validate and persist after refresh', async ({ page }) => {
  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByLabel('Game session time').fill('59');
  await page.getByRole('button', { name: 'Save options' }).click();
  await expect(page.getByRole('alert')).toContainText('60–180');
  await page.getByLabel('Game session time').fill('180');
  await page.getByLabel('Enemy spawn time').fill('5');
  await page.getByRole('button', { name: 'Save options' }).click();
  await expect(page.getByText('Matches using 180s sessions and 5s spawns.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Options' }).click();
  await expect(page.getByLabel('Game session time')).toHaveValue('180');
  await expect(page.getByLabel('Enemy spawn time')).toHaveValue('5');
});

test('ranking paginates and history shows an empty state', async ({ page }) => {
  await page.getByLabel('Simulated response').selectOption('multiple-pages');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Page 1 of 3')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Page 2 of 3')).toBeVisible();
  await page.getByRole('tab', { name: 'Match History' }).click();
  await expect(page.getByText('No matches on this page.')).toBeVisible();
});

test('failure scenarios recover without blocking options or game access', async ({ page }) => {
  await page.getByLabel('Simulated response').selectOption('ranking-error');
  await expect(page.getByText('Could not load ranking.')).toBeVisible();
  await page.getByRole('button', { name: 'Options' }).click();
  await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu' }).click();
  await page.getByLabel('Simulated response').selectOption('success');
  await expect(page.getByRole('table')).toBeVisible();
});

test('result shell remains accessible without a completed gameplay match', async ({ page }) => {
  await page.getByRole('button', { name: 'Last Result' }).click();
  await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible();
  await expect(page.getByText('No completed match has been recorded on this device yet.')).toBeVisible();
});
