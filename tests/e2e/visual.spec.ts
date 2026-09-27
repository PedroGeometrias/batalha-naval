import { test, expect } from '@playwright/test';

test('menu visual baseline', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The versioned reference uses desktop Chromium.');
  await page.goto('/?test=1');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page).toHaveScreenshot('menu.png', { animations: 'disabled' });
});

test('arena visual baseline', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The versioned reference uses desktop Chromium.');
  await page.goto('/?test=1');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.battle-message')).toHaveCount(0);
  await expect(page).toHaveScreenshot('arena.png', { animations: 'disabled' });
});

test('result visual baseline', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The versioned reference uses desktop Chromium.');
  await page.goto('/?test=1');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.battle-message')).toHaveCount(0);
  await page.evaluate(() => window.__PIRATE_TEST__!.advance(120));
  await expect(page.getByText('Recorded')).toBeVisible();
  await expect(page).toHaveScreenshot('result.png', { animations: 'disabled' });
});
